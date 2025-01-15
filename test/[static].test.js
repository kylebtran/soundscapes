const request = require("supertest");
const app = require("../app");

const mockRender = jest.fn((view, options, callback) => {
  callback(null, "<div>Mocked HTML</div>");
});
app.set("render", mockRender);

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  jest.resetModules();
});
afterAll(() => {
  jest.clearAllMocks();
});

describe("Static Pages", () => {
  describe("Index Router", () => {
    test("Render landing page", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/html/);
    });
  });

  describe("About Router", () => {
    test("Render about page", async () => {
      const response = await request(app).get("/about");

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/html/);
    });
  });

  describe("Contact Router", () => {
    test("Render contact page", async () => {
      const response = await request(app).get("/contact");

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/html/);
    });
  });

  describe("Error Handling", () => {
    test("Handle 404 errors", async () => {
      const response = await request(app)
        .get("/error-route")
        .set("Accept", "application/json");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "Not found",
      });
    });
  });
});
