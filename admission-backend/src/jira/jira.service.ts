import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioStorageService } from '../storage/minio-storage.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class JiraService {
  constructor(
    private prisma: PrismaService,
    private storageService: MinioStorageService,
  ) {}

  // ============ Projects ============
  async createProject(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ...dto,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        columns: {
          create: [
            { name: 'Chờ Xử Lý', order: 0, color: '#94a3b8' },
            { name: 'Đang Thực Hiện', order: 1, color: '#3b82f6' },
            { name: 'Đang Kiểm Tra', order: 2, color: '#f59e0b' },
            { name: 'Hoàn Thành', order: 3, color: '#10b981' },
            { name: 'Tạm Dừng', order: 4, color: '#ef4444' },
          ],
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
        members: { include: { user: true } },
        _count: { select: { tasks: true } },
      },
    });

    await this.logActivity(project.id, null, userId, 'created_project', {
      projectName: project.name,
    });

    return project;
  }

  async getProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
        members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                reporter: { select: { id: true, fullName: true, email: true } },
                labels: { include: { label: true } },
                _count: { select: { comments: true, attachments: true } },
              },
            },
          },
        },
        members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      },
    });
  }

  // ============ Tasks ============
  async createTask(projectId: string, userId: string, dto: CreateTaskDto) {
    await this.checkProjectAccess(projectId, userId);

    const maxPosition = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    // Convert date string to ISO DateTime if provided
    const dueDate = dto.dueDate ? new Date(dto.dueDate).toISOString() : undefined;

    const task = await this.prisma.task.create({
      data: {
        ...dto,
        dueDate,
        projectId,
        reporterId: userId,
        position: (maxPosition?.position || 0) + 1000,
        labels: dto.labels
          ? {
              create: dto.labels.map((name) => ({
                label: {
                  connectOrCreate: {
                    where: { name },
                    create: { name, color: this.getRandomColor() },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
      },
    });

    await this.logActivity(projectId, task.id, userId, 'created', {
      title: task.title,
    });

    return task;
  }

  async updateTask(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    // Remove fields that need special handling
    const { columnId, labels, assigneeId, ...updateData } = dto;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        // Handle assigneeId properly - can be null
        ...(assigneeId !== undefined && {
          assignee: assigneeId
            ? { connect: { id: assigneeId } }
            : { disconnect: true },
        }),
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
      },
    });

    await this.logActivity(task.projectId, taskId, userId, 'updated', dto);

    return updated;
  }

  async moveTask(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    // Get target column info
    const targetColumn = await this.prisma.column.findUnique({
      where: { id: dto.columnId },
    });

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: dto.columnId,
        position: dto.position,
        ...(dto.blockedReason !== undefined && { blockedReason: dto.blockedReason }),
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
      },
    });

    await this.logActivity(task.projectId, taskId, userId, 'moved', {
      from: task.column.name,
      to: targetColumn?.name || 'Không rõ',
      ...(dto.blockedReason && { blockedReason: dto.blockedReason }),
    });

    return updated;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    await this.prisma.task.delete({ where: { id: taskId } });

    await this.logActivity(task.projectId, null, userId, 'deleted', {
      title: task.title,
    });

    return { message: 'Xóa công việc thành công' };
  }

  async getTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
        comments: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: { uploader: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    return task;
  }

  // ============ Comments ============
  async createComment(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.logActivity(task.projectId, taskId, userId, 'commented', {
      comment: dto.content.substring(0, 100),
    });

    return comment;
  }

  // ============ Filters ============
  async getMyTasks(userId: string, projectId?: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        ...(projectId && { projectId }),
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
        project: { select: { id: true, name: true, key: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async searchTasks(projectId: string, userId: string, query: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.task.findMany({
      where: {
        projectId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        labels: { include: { label: true } },
        column: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ============ Activity Logs ============
  async getActivityLogs(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.activityLog.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ============ Helpers ============
  private async checkProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
    }

    return member;
  }

  private async logActivity(
    projectId: string,
    taskId: string | null,
    userId: string,
    action: string,
    changes: any,
  ) {
    await this.prisma.activityLog.create({
      data: {
        projectId,
        taskId,
        userId,
        action,
        changes,
      },
    });
  }

  private getRandomColor(): string {
    const colors = [
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ============ Attachments ============
  async uploadAttachment(taskId: string, userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được cung cấp');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkProjectAccess(task.projectId, userId);

    // Upload to MinIO
    const storageResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Save to database
    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        filename: storageResult.fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: storageResult.size,
        storagePath: storageResult.url,
        uploadedBy: userId,
      },
      include: {
        uploader: { select: { id: true, fullName: true } },
      },
    });

    await this.logActivity(task.projectId, taskId, userId, 'uploaded_attachment', {
      filename: file.originalname,
    });

    return attachment;
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment) throw new NotFoundException('Không tìm thấy file đính kèm');
    await this.checkProjectAccess(attachment.task.projectId, userId);

    // Delete from MinIO
    try {
      await this.storageService.deleteFile(attachment.filename);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Không thể xóa file từ storage:', error);
    }

    // Delete from database
    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    await this.logActivity(
      attachment.task.projectId,
      attachment.taskId,
      userId,
      'deleted_attachment',
      { filename: attachment.originalName },
    );

    return { message: 'Xóa file đính kèm thành công' };
  }

  // ============ Statistics & Dashboard ============
  async getProjectStatistics(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      tasksByType,
      tasksByAssignee,
      recentActivity,
      overdueTasksCount,
    ] = await Promise.all([
      // Total tasks
      this.prisma.task.count({ where: { projectId } }),

      // Tasks by status (column)
      this.prisma.task.groupBy({
        by: ['columnId'],
        where: { projectId },
        _count: true,
      }),

      // Tasks by priority
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: true,
      }),

      // Tasks by type
      this.prisma.task.groupBy({
        by: ['type'],
        where: { projectId },
        _count: true,
      }),

      // Tasks by assignee
      this.prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId, assigneeId: { not: null } },
        _count: true,
      }),

      // Recent activity
      this.prisma.activityLog.findMany({
        where: { projectId },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Overdue tasks
      this.prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          column: { name: { not: 'Hoàn Thành' } },
        },
      }),
    ]);

    // Get column names
    const columns = await this.prisma.column.findMany({
      where: { projectId },
      select: { id: true, name: true, color: true },
    });

    // Get assignee names
    const assigneeIds = tasksByAssignee.map((t) => t.assigneeId).filter(Boolean);
    const assignees = await this.prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, fullName: true },
    });

    // Format data
    const columnMap = new Map(columns.map((c) => [c.id, c]));
    const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

    return {
      totalTasks,
      overdueTasksCount,
      tasksByStatus: tasksByStatus.map((item) => ({
        columnId: item.columnId,
        columnName: columnMap.get(item.columnId)?.name || 'Không rõ',
        color: columnMap.get(item.columnId)?.color,
        count: item._count,
      })),
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        count: item._count,
      })),
      tasksByType: tasksByType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      tasksByAssignee: tasksByAssignee.map((item) => ({
        assigneeId: item.assigneeId,
        assigneeName: assigneeMap.get(item.assigneeId!)?.fullName || 'Chưa phân công',
        count: item._count,
      })),
      recentActivity,
    };
  }

  async getMyTasksSummary(userId: string) {
    const [assignedToMe, reportedByMe, totalProjects] = await Promise.all([
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          column: { name: { not: 'Hoàn Thành' } },
        },
      }),
      this.prisma.task.count({
        where: {
          reporterId: userId,
          column: { name: { not: 'Hoàn Thành' } },
        },
      }),
      this.prisma.projectMember.count({
        where: { userId },
      }),
    ]);

    return {
      assignedToMe,
      reportedByMe,
      totalProjects,
    };
  }

  // ============ Project Members Management ============
  async addMember(projectId: string, userId: string, memberEmail: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
    const member = await this.checkProjectAccess(projectId, userId);
    
    if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ chủ dự án hoặc quản trị viên mới có thể thêm thành viên');
    }

    const newMember = await this.prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!newMember) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: newMember.id },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Người dùng đã là thành viên của dự án');
    }

    const projectMember = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: newMember.id,
        role,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.logActivity(projectId, null, userId, 'added_member', {
      memberName: newMember.fullName,
      role,
    });

    return projectMember;
  }

  async removeMember(projectId: string, userId: string, memberId: string) {
    const member = await this.checkProjectAccess(projectId, userId);
    
    if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ chủ dự án hoặc quản trị viên mới có thể xóa thành viên');
    }

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberId },
      },
      include: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Không tìm thấy thành viên');
    }

    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Không thể xóa chủ dự án');
    }

    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: memberId },
      },
    });

    await this.logActivity(projectId, null, userId, 'removed_member', {
      memberName: targetMember.user.fullName,
    });

    return { message: 'Đã xóa thành viên khỏi dự án' };
  }
}
