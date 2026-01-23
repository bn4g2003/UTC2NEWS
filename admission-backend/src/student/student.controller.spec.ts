import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

describe('StudentController', () => {
  let controller: StudentController;
  let service: StudentService;

  const mockStudentService = {
    createStudent: jest.fn(),
    updateStudent: jest.fn(),
    getStudent: jest.fn(),
    addPreference: jest.fn(),
    updatePreference: jest.fn(),
    removePreference: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<StudentController>(StudentController);
    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createStudent', () => {
    it('should create a student', async () => {
      const createDto = {
        idCard: '123456789',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
      };

      const mockStudent = { id: 'student-1', ...createDto };
      mockStudentService.createStudent.mockResolvedValue(mockStudent);

      const result = await controller.createStudent(createDto);

      expect(result).toEqual(mockStudent);
      expect(service.createStudent).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateStudent', () => {
    it('should update a student', async () => {
      const updateDto = { fullName: 'Updated Name' };
      const mockStudent = { id: 'student-1', ...updateDto };
      mockStudentService.updateStudent.mockResolvedValue(mockStudent);

      const result = await controller.updateStudent('student-1', updateDto);

      expect(result).toEqual(mockStudent);
      expect(service.updateStudent).toHaveBeenCalledWith('student-1', updateDto);
    });
  });

  describe('getStudent', () => {
    it('should get a student', async () => {
      const mockStudent = {
        id: 'student-1',
        idCard: '123456789',
        fullName: 'Test Student',
        applications: [],
      };
      mockStudentService.getStudent.mockResolvedValue(mockStudent);

      const result = await controller.getStudent('student-1');

      expect(result).toEqual(mockStudent);
      expect(service.getStudent).toHaveBeenCalledWith('student-1');
    });
  });

  describe('addPreference', () => {
    it('should add a preference', async () => {
      const addPreferenceDto = {
        sessionId: 'session-1',
        majorCode: 'CS101',
        admissionMethod: 'entrance_exam',
        preferencePriority: 1,
        subjectScores: { math: 9 },
      };

      const mockApplication = { id: 'app-1', ...addPreferenceDto };
      mockStudentService.addPreference.mockResolvedValue(mockApplication);

      const result = await controller.addPreference('student-1', addPreferenceDto);

      expect(result).toEqual(mockApplication);
      expect(service.addPreference).toHaveBeenCalledWith(
        'student-1',
        addPreferenceDto,
      );
    });
  });

  describe('updatePreference', () => {
    it('should update a preference', async () => {
      const updatePreferenceDto = { admissionMethod: 'high_school_transcript' };
      const mockApplication = { id: 'app-1', ...updatePreferenceDto };
      mockStudentService.updatePreference.mockResolvedValue(mockApplication);

      const result = await controller.updatePreference(
        'student-1',
        'app-1',
        updatePreferenceDto,
      );

      expect(result).toEqual(mockApplication);
      expect(service.updatePreference).toHaveBeenCalledWith(
        'student-1',
        'app-1',
        updatePreferenceDto,
      );
    });
  });

  describe('removePreference', () => {
    it('should remove a preference', async () => {
      const mockResponse = { message: 'Preference removed successfully' };
      mockStudentService.removePreference.mockResolvedValue(mockResponse);

      const result = await controller.removePreference('student-1', 'app-1');

      expect(result).toEqual(mockResponse);
      expect(service.removePreference).toHaveBeenCalledWith('student-1', 'app-1');
    });
  });
});
