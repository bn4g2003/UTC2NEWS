import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JiraService } from './jira.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('jira')
@UseGuards(JwtAuthGuard)
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  // ============ Projects ============
  @Post('projects')
  createProject(@Request() req, @Body() dto: CreateProjectDto) {
    return this.jiraService.createProject(req.user.userId, dto);
  }

  @Get('projects')
  getProjects(@Request() req) {
    return this.jiraService.getProjects(req.user.userId);
  }

  @Get('projects/:projectId')
  getProject(@Param('projectId') projectId: string, @Request() req) {
    return this.jiraService.getProject(projectId, req.user.userId);
  }

  // ============ Tasks ============
  @Post('projects/:projectId/tasks')
  createTask(
    @Param('projectId') projectId: string,
    @Request() req,
    @Body() dto: CreateTaskDto,
  ) {
    return this.jiraService.createTask(projectId, req.user.userId, dto);
  }

  @Get('tasks/:taskId')
  getTask(@Param('taskId') taskId: string, @Request() req) {
    return this.jiraService.getTask(taskId, req.user.userId);
  }

  @Put('tasks/:taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Request() req,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.jiraService.updateTask(taskId, req.user.userId, dto);
  }

  @Put('tasks/:taskId/move')
  moveTask(
    @Param('taskId') taskId: string,
    @Request() req,
    @Body() dto: MoveTaskDto,
  ) {
    return this.jiraService.moveTask(taskId, req.user.userId, dto);
  }

  @Delete('tasks/:taskId')
  deleteTask(@Param('taskId') taskId: string, @Request() req) {
    return this.jiraService.deleteTask(taskId, req.user.userId);
  }

  // ============ Comments ============
  @Post('tasks/:taskId/comments')
  createComment(
    @Param('taskId') taskId: string,
    @Request() req,
    @Body() dto: CreateCommentDto,
  ) {
    return this.jiraService.createComment(taskId, req.user.userId, dto);
  }

  // ============ Filters ============
  @Get('my-tasks')
  getMyTasks(@Request() req, @Query('projectId') projectId?: string) {
    return this.jiraService.getMyTasks(req.user.userId, projectId);
  }

  @Get('projects/:projectId/search')
  searchTasks(
    @Param('projectId') projectId: string,
    @Request() req,
    @Query('q') query: string,
  ) {
    return this.jiraService.searchTasks(projectId, req.user.userId, query);
  }

  // ============ Activity Logs ============
  @Get('projects/:projectId/activity')
  getActivityLogs(@Param('projectId') projectId: string, @Request() req) {
    return this.jiraService.getActivityLogs(projectId, req.user.userId);
  }

  // ============ Attachments ============
  @Post('tasks/:taskId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('taskId') taskId: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.jiraService.uploadAttachment(taskId, req.user.userId, file);
  }

  @Delete('attachments/:attachmentId')
  deleteAttachment(@Param('attachmentId') attachmentId: string, @Request() req) {
    return this.jiraService.deleteAttachment(attachmentId, req.user.userId);
  }

  // ============ Statistics & Dashboard ============
  @Get('projects/:projectId/statistics')
  getProjectStatistics(@Param('projectId') projectId: string, @Request() req) {
    return this.jiraService.getProjectStatistics(projectId, req.user.userId);
  }

  @Get('my-summary')
  getMyTasksSummary(@Request() req) {
    return this.jiraService.getMyTasksSummary(req.user.userId);
  }

  // ============ Project Members ============
  @Post('projects/:projectId/members')
  addMember(
    @Param('projectId') projectId: string,
    @Request() req,
    @Body() body: { email: string; role?: 'ADMIN' | 'MEMBER' },
  ) {
    return this.jiraService.addMember(projectId, req.user.userId, body.email, body.role);
  }

  @Delete('projects/:projectId/members/:memberId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.jiraService.removeMember(projectId, req.user.userId, memberId);
  }
}
