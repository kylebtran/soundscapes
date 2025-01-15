const request = require("supertest");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const app = require("../app");

jest.mock("ejs", () => ({
  renderFile: jest.fn().mockResolvedValue("<div>Mocked HTML</div>"),
}));

const mockAxios = new MockAdapter(axios);

// Setup and teardown
beforeEach(() => {
  mockAxios.reset();
  jest.clearAllMocks();
});
afterEach(() => {
  jest.resetModules();
});
afterAll(() => {
  mockAxios.restore();
  jest.clearAllMocks();
});

describe("Search Router", () => {
  describe("GET /search", () => {
    test("Return default tracks", async () => {
      const defaultTrackIds = [
        "2967020181",
        "1987726237",
        "626123",
        "770637812",
        "136341550",
        "3137127971",
      ];

      defaultTrackIds.forEach((id) => {
        mockAxios.onGet(`https://api.deezer.com/track/${id}`).reply(200, {
          id,
          title: `Track ${id}`,
          artist: { name: "Test Artist" },
          album: { title: "Test Album" },
        });
      });

      const response = await request(app)
        .get("/search")
        .set("X-Requested-With", "XMLHttpRequest");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.length).toBe(6);
      response.body.data.results.forEach((track, index) => {
        expect(track.id).toBe(defaultTrackIds[index]);
      });
    });

    test("Handle search query and pagination", async () => {
      const mockSearchResponse = {
        data: [
          {
            id: 1,
            title: "Test Track",
            artist: { name: "Test Artist" },
            album: { title: "Test Album" },
          },
        ],
        total: 100,
      };

      mockAxios
        .onGet("https://api.deezer.com/search")
        .reply(200, mockSearchResponse);

      const response = await request(app)
        .get("/search?q=test&page=2&limit=25")
        .set("X-Requested-With", "XMLHttpRequest");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meta.page).toBe(2);
    });

    test("Handle API errors", async () => {
      mockAxios.onGet("https://api.deezer.com/search").networkError();

      const response = await request(app)
        .get("/search?q=test")
        .set("X-Requested-With", "XMLHttpRequest");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
