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

describe("Track Router", () => {
  describe("GET /track/:id", () => {
    test("Return complete track details", async () => {
      const mockTrackId = "123456";
      const mockAlbumId = "789";

      mockAxios
        .onGet(`https://api.deezer.com/track/${mockTrackId}`)
        .reply(200, {
          id: mockTrackId,
          title: "Test Track",
          artist: { name: "Test Artist" },
          album: {
            id: mockAlbumId,
            title: "Test Album",
            cover_big: "test-cover.jpg",
          },
          rank: 100000,
          release_date: "2024-01-01",
          duration: 180,
          preview: "test-preview.mp3",
        });

      mockAxios
        .onGet(`https://api.deezer.com/album/${mockAlbumId}`)
        .reply(200, {
          id: mockAlbumId,
          title: "Test Album",
          record_type: "album",
          genres: {
            data: [{ name: "Pop" }, { name: "Rock" }],
          },
          tracks: {
            data: [
              {
                id: "123456",
                title: "Test Track 1",
                duration: 180,
                artist: { name: "Test Artist" },
              },
            ],
          },
        });

      const response = await request(app)
        .get(`/track/${mockTrackId}`)
        .set("Accept", "application/json");

      expect(response.status).toBe(200);
      expect(mockAxios.history.get[0].url).toBe(
        `https://api.deezer.com/track/${mockTrackId}`
      );
      expect(mockAxios.history.get[1].url).toBe(
        `https://api.deezer.com/album/${mockAlbumId}`
      );
    });

    test("Handle non-existent tracks", async () => {
      const mockTrackId = "nonexistent";
      mockAxios
        .onGet(`https://api.deezer.com/track/${mockTrackId}`)
        .reply(404, {
          error: {
            type: "DataException",
            message: "Track not found",
          },
        });

      const response = await request(app)
        .get(`/track/${mockTrackId}`)
        .set("Accept", "application/json");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: "Failed to fetch track.",
      });
    });

    test("Handle album errors", async () => {
      const mockTrackId = "123456";
      const mockAlbumId = "789";

      mockAxios
        .onGet(`https://api.deezer.com/track/${mockTrackId}`)
        .reply(200, {
          id: mockTrackId,
          title: "Test Track",
          album: { id: mockAlbumId },
        });

      mockAxios
        .onGet(`https://api.deezer.com/album/${mockAlbumId}`)
        .networkError();

      const response = await request(app)
        .get(`/track/${mockTrackId}`)
        .set("Accept", "application/json");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: "Failed to fetch track.",
      });
    });

    test("Handle network errors", async () => {
      const mockTrackId = "123456";
      mockAxios
        .onGet(`https://api.deezer.com/track/${mockTrackId}`)
        .networkError();

      const response = await request(app)
        .get(`/track/${mockTrackId}`)
        .set("Accept", "application/json");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: "Failed to fetch track.",
      });
    });
  });
});
