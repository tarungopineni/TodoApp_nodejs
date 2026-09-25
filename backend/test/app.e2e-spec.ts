import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';

describe('TodoMobile Backend API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let todo1Id: string;

  const mockMailService = {
    sendReminderEmail: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.REMINDER_CRON_SECRET = 'test_cron_secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Health Check', () => {
    it('/healthy (GET) should return 200 OK', () => {
      return request(app.getHttpServer())
        .get('/healthy')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBeDefined();
        });
    });
  });

  describe('Authentication (/auth)', () => {
    it('POST /auth/create - Register User 1 successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/create')
        .send({
          email: 'alice@example.com',
          username: 'alice',
          first_name: 'Alice',
          last_name: 'Smith',
          role: 'dev',
          hashed_password: 'Password123!',
        })
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
    });

    it('POST /auth/create - Fail on duplicate username (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/create')
        .send({
          email: 'alice_different@example.com',
          username: 'alice', // Duplicate
          first_name: 'Alice',
          last_name: 'Smith',
          role: 'dev',
          hashed_password: 'Password123!',
        })
        .expect(409);

      expect(response.body.message).toContain('Username already exists');
    });

    it('POST /auth/create - Fail on duplicate email (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/create')
        .send({
          email: 'alice@example.com', // Duplicate
          username: 'alice_new_user',
          first_name: 'Alice',
          last_name: 'Smith',
          role: 'dev',
          hashed_password: 'Password123!',
        })
        .expect(409);

      expect(response.body.message).toContain('Email already exists');
    });

    it('POST /auth/token - Login User 1 with form-urlencoded (200)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/token')
        .type('form')
        .send({
          username: 'alice',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.token_type).toBe('bearer');
      user1Token = response.body.access_token;
    });

    it('POST /auth/token - Fail on invalid credentials (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/token')
        .type('form')
        .send({
          username: 'alice',
          password: 'WrongPassword!',
        })
        .expect(401);
    });

    it('Register and Login User 2 for isolation testing', async () => {
      await request(app.getHttpServer())
        .post('/auth/create')
        .send({
          email: 'bob@example.com',
          username: 'bob',
          first_name: 'Bob',
          last_name: 'Jones',
          role: 'dev',
          hashed_password: 'Password123!',
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          username: 'bob',
          password: 'Password123!',
        })
        .expect(200);

      user2Token = loginRes.body.access_token;
    });
  });

  describe('User Profile (/user)', () => {
    it('GET /user/ - Return profile for User 1 (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.username).toBe('alice');
      expect(response.body.email).toBe('alice@example.com');
      expect(response.body.first_name).toBe('Alice');
      expect(response.body.last_name).toBe('Smith');
      expect(response.body.id).toBeDefined();
      expect(response.body.password).toBeUndefined();
      user1Id = response.body.id;
    });

    it('GET /user/ - Reject unauthenticated request (401)', async () => {
      await request(app.getHttpServer())
        .get('/user/')
        .expect(401);
    });
  });

  describe('Todo CRUD (/todos)', () => {
    it('POST /todos/todos - Create Todo for User 1 (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/todos/todos')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Finish Assignment',
          description: 'Build NestJS backend app',
          priority: 5,
          complete: false,
          task_datetime: '2030-09-23T10:00:00.000Z',
          deadline: '2030-09-24T18:00:00.000Z',
        })
        .expect(201);

      expect(response.body.message).toBe('Todo created successfully');
      expect(response.body.todo).toBeDefined();
      expect(response.body.todo.title).toBe('Finish Assignment');
      expect(response.body.todo.priority).toBe(5);
      expect(response.body.todo.owner_id).toBe(user1Id);
      todo1Id = response.body.todo.id;
    });

    it('GET /todos/ - List Todos for User 1 (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos/')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(todo1Id);
    });

    it('GET /todos/todo/:id - Fetch Todo 1 by ID (200)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(todo1Id);
      expect(response.body.title).toBe('Finish Assignment');
    });

    it('PUT /todos/todo/:id - Update Todo 1 status to complete (200)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Finish Assignment (Updated)',
          description: 'Build NestJS backend app',
          priority: 5,
          complete: true,
          task_datetime: '2030-09-23T10:00:00.000Z',
          deadline: '2030-09-24T18:00:00.000Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Todo updated successfully');
      expect(response.body.todo.complete).toBe(true);
    });

    it('USER ISOLATION: User 2 cannot view User 1 Todo (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('USER ISOLATION: User 2 cannot update User 1 Todo (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .put(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Title',
          description: 'Attempt to overwrite',
          priority: 1,
          complete: false,
        })
        .expect(403);
    });

    it('USER ISOLATION: User 2 cannot delete User 1 Todo (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .delete(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('DELETE /todos/todo/:id - User 1 deletes own Todo (200)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/todos/todo/${todo1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.message).toBe('Todo deleted successfully');
    });

    it('GET /todos/ - Verify Todo is removed (200 empty array)', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos/')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    describe('Datetime Validation', () => {
      it('POST /todos/todos - Fail on past task_datetime (400)', async () => {
        const pastStart = new Date(Date.now() - 3600000).toISOString();
        const futureDeadline = new Date(Date.now() + 86400000).toISOString();

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Past Start Todo',
            description: 'Testing past start time',
            priority: 3,
            complete: false,
            task_datetime: pastStart,
            deadline: futureDeadline,
          })
          .expect(400);

        expect(response.body.message).toBe('Start time cannot be in the past.');
      });

      it('POST /todos/todos - Fail on past deadline (400)', async () => {
        const futureStart = new Date(Date.now() + 3600000).toISOString();
        const pastDeadline = new Date(Date.now() - 3600000).toISOString();

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Past Deadline Todo',
            description: 'Testing past deadline',
            priority: 3,
            complete: false,
            task_datetime: futureStart,
            deadline: pastDeadline,
          })
          .expect(400);

        expect(response.body.message).toBe('Deadline cannot be in the past.');
      });

      it('POST /todos/todos - Fail when deadline is before task_datetime (400)', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const earlierDeadline = new Date(Date.now() + 3600000).toISOString();

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Invalid Order Todo',
            description: 'Deadline before start time',
            priority: 3,
            complete: false,
            task_datetime: futureStart,
            deadline: earlierDeadline,
          })
          .expect(400);

        expect(response.body.message).toBe('Deadline cannot be before the task start time.');
      });

      it('POST /todos/todos - Succeed with valid future start time and deadline (201)', async () => {
        const futureStart = new Date(Date.now() + 3600000).toISOString();
        const futureDeadline = new Date(Date.now() + 86400000).toISOString();

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Valid Datetime Todo',
            description: 'Future start and deadline',
            priority: 3,
            complete: false,
            task_datetime: futureStart,
            deadline: futureDeadline,
          })
          .expect(201);

        expect(response.body.message).toBe('Todo created successfully');
        expect(response.body.todo.task_datetime).toBe(futureStart);
        expect(response.body.todo.deadline).toBe(futureDeadline);
      });
    });

    describe('SMTP Email Reminders & Internal Cron Endpoint', () => {
      it('Todo deadline > 1 hour away -> no immediate email sent (mailSent: false)', async () => {
        mockMailService.sendReminderEmail.mockClear();
        const futureDeadline = new Date(Date.now() + 2 * 3600000).toISOString(); // 2 hours away

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Far Future Todo',
            description: 'Deadline 2h away',
            priority: 3,
            complete: false,
            deadline: futureDeadline,
          })
          .expect(201);

        expect(mockMailService.sendReminderEmail).not.toHaveBeenCalled();
        expect(response.body.todo.mailSent).toBe(false);
      });

      it('Todo deadline within 1 hour -> immediate email sent successfully (mailSent: true)', async () => {
        mockMailService.sendReminderEmail.mockClear();
        mockMailService.sendReminderEmail.mockResolvedValueOnce(true);
        const soonDeadline = new Date(Date.now() + 30 * 60000).toISOString(); // 30 minutes away

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Urgent Todo',
            description: 'Deadline 30m away',
            priority: 5,
            complete: false,
            deadline: soonDeadline,
          })
          .expect(201);

        expect(mockMailService.sendReminderEmail).toHaveBeenCalledTimes(1);
        expect(response.body.todo.mailSent).toBe(true);
      });

      it('Failed immediate email -> creation succeeds but mailSent remains false', async () => {
        mockMailService.sendReminderEmail.mockClear();
        mockMailService.sendReminderEmail.mockResolvedValueOnce(false); // Simulate SMTP failure
        const soonDeadline = new Date(Date.now() + 45 * 60000).toISOString(); // 45 minutes away

        const response = await request(app.getHttpServer())
          .post('/todos/todos')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            title: 'Failed Email Todo',
            description: 'Testing SMTP error resilience',
            priority: 3,
            complete: false,
            deadline: soonDeadline,
          })
          .expect(201);

        expect(mockMailService.sendReminderEmail).toHaveBeenCalledTimes(1);
        expect(response.body.todo.mailSent).toBe(false);
      });

      it('POST /internal/reminders/check without Authorization header -> 401 Unauthorized', async () => {
        await request(app.getHttpServer())
          .post('/internal/reminders/check')
          .expect(401);
      });

      it('POST /internal/reminders/check with incorrect secret -> 401 Unauthorized', async () => {
        await request(app.getHttpServer())
          .post('/internal/reminders/check')
          .set('Authorization', 'Bearer wrong_secret')
          .expect(401);
      });

      it('POST /internal/reminders/check with correct secret -> processes pending reminders', async () => {
        mockMailService.sendReminderEmail.mockClear();
        mockMailService.sendReminderEmail.mockResolvedValue(true);

        const response = await request(app.getHttpServer())
          .post('/internal/reminders/check')
          .set('Authorization', 'Bearer test_cron_secret')
          .expect(200);

        expect(response.body.checked).toBeGreaterThanOrEqual(1);
        expect(response.body.sent).toBeGreaterThanOrEqual(1);
        expect(response.body.failed).toBe(0);
      });

      it('POST /internal/reminders/check - Duplicate protection (mailSent: true todos not re-sent)', async () => {
        mockMailService.sendReminderEmail.mockClear();

        const response = await request(app.getHttpServer())
          .post('/internal/reminders/check')
          .set('Authorization', 'Bearer test_cron_secret')
          .expect(200);

        // Already processed todos with mailSent: true are skipped
        expect(response.body.sent).toBe(0);
        expect(mockMailService.sendReminderEmail).not.toHaveBeenCalled();
      });

      it('POST /internal/email/test with correct secret -> returns immediately with success message', async () => {
        mockMailService.sendReminderEmail.mockClear();

        const response = await request(app.getHttpServer())
          .post('/internal/email/test')
          .set('Authorization', 'Bearer test_cron_secret')
          .send({ to: 'test@example.com' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Email sending initiated');
        expect(mockMailService.sendReminderEmail).toHaveBeenCalledTimes(1);
      });

      it('POST /internal/reminders/test-send without auth -> evaluates eligible tasks and returns results', async () => {
        mockMailService.sendReminderEmail.mockClear();
        mockMailService.sendReminderEmail.mockResolvedValue(true);

        const response = await request(app.getHttpServer())
          .post('/internal/reminders/test-send')
          .expect(200);

        expect(response.body.eligible).toBeDefined();
        expect(response.body.sent).toBeDefined();
        expect(response.body.failed).toBeDefined();
        expect(Array.isArray(response.body.results)).toBe(true);
      });
    });
  });
});
