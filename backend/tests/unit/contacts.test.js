const request = require('supertest');
const app = require('../../server');
const { User, Contact } = require('../src/models');

describe('Contact Management API', () => {
  let authToken;
  let testUser;
  let testContact;

  beforeAll(async () => {
    // Create test user and login
    const userData = {
      username: 'contacttest',
      email: 'contacttest@example.com',
      password: 'TestPassword123',
      full_name: 'Contact Test User'
    };

    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    authToken = loginResponse.body.data.token;
    testUser = loginResponse.body.data.user;
  });

  afterAll(async () => {
    // Clean up test data
    await Contact.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { email: 'contacttest@example.com' } });
  });

  describe('POST /api/v1/contacts', () => {
    it('should create a new contact successfully', async () => {
      const contactData = {
        name: 'Test Contact',
        phone_number: '+1234567890',
        email: 'testcontact@example.com',
        tags: ['test', 'important']
      };

      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contact).toHaveProperty('id');
      expect(response.body.data.contact.name).toBe(contactData.name);
      expect(response.body.data.contact.phone_number).toBe(contactData.phone_number);
      expect(response.body.data.contact.email).toBe(contactData.email);
      expect(response.body.data.contact.tags).toEqual(contactData.tags);
      expect(response.body.data.contact.user_id).toBe(testUser.id);

      testContact = response.body.data.contact;
    });

    it('should fail without authentication', async () => {
      const contactData = {
        name: 'Unauthorized Contact',
        phone_number: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/contacts')
        .send(contactData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid phone number', async () => {
      const contactData = {
        name: 'Invalid Contact',
        phone_number: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid phone number');
    });

    it('should fail with invalid email', async () => {
      const contactData = {
        name: 'Invalid Email Contact',
        phone_number: '+1234567890',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should fail with duplicate phone number', async () => {
      const contactData = {
        name: 'Duplicate Contact',
        phone_number: '+1234567890' // Same as testContact
      };

      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Phone number already exists');
    });
  });

  describe('GET /api/v1/contacts', () => {
    it('should get all contacts for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contacts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.contacts)).toBe(true);
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
    });

    it('should filter contacts by tags', async () => {
      const response = await request(app)
        .get('/api/v1/contacts?tags=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toBeDefined();
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
    });

    it('should search contacts by name', async () => {
      const response = await request(app)
        .get('/api/v1/contacts?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/v1/contacts/:id', () => {
    it('should get specific contact by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contact.id).toBe(testContact.id);
      expect(response.body.data.contact.name).toBe(testContact.name);
    });

    it('should fail with non-existent contact ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/contacts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contact not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContact.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/v1/contacts/:id', () => {
    it('should update contact successfully', async () => {
      const updateData = {
        name: 'Updated Test Contact',
        email: 'updated@example.com',
        tags: ['updated', 'important']
      };

      const response = await request(app)
        .put(`/api/v1/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contact.name).toBe(updateData.name);
      expect(response.body.data.contact.email).toBe(updateData.email);
      expect(response.body.data.contact.tags).toEqual(updateData.tags);
    });

    it('should fail updating contact owned by another user', async () => {
      // Create another user
      const otherUserData = {
        username: 'othercontactuser',
        email: 'othercontact@example.com',
        password: 'TestPassword123',
        full_name: 'Other Contact User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(otherUserData);

      const otherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: otherUserData.email,
          password: otherUserData.password
        });

      const otherToken = otherLoginResponse.body.data.token;

      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/v1/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');

      // Clean up other user
      await User.destroy({ where: { email: 'othercontact@example.com' } });
    });
  });

  describe('DELETE /api/v1/contacts/:id', () => {
    it('should delete contact successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Contact deleted successfully');
    });

    it('should fail deleting non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/contacts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contact not found');
    });
  });

  describe('POST /api/v1/contacts/import', () => {
    it('should import contacts from CSV', async () => {
      const csvData = `name,phone_number,email,tags
Contact 1,+1111111111,contact1@example.com,"tag1,tag2"
Contact 2,+2222222222,contact2@example.com,"tag3"`;

      const response = await request(app)
        .post('/api/v1/contacts/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvData), {
          filename: 'contacts.csv',
          contentType: 'text/csv'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('imported_count');
      expect(response.body.data).toHaveProperty('failed_count');
    });

    it('should fail with invalid file format', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('invalid data'), {
          filename: 'contacts.txt',
          contentType: 'text/plain'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid file format');
    });
  });

  describe('GET /api/v1/contacts/export', () => {
    it('should export contacts to CSV', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
}); 