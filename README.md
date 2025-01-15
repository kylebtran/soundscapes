# Soundscapes

Soundscapes is a music discovery platform that utilizes Deezer API to create successive preview playlists. Users may explore musical styles and artist discographies through continuous playback of track previews, enabling more intuitive music discovery.

## Features

- Dynamic searching for tracks, albums, and artists
- XSS-sanitized search results with image placeholders
- Continuous playback of track previews in succession
- Local caching system for previously searched tracks
- Hybrid server-client pagination controls
- Multi-page track and album information display
- Shareable search results via URL parameters
- Responsive design for mobile and desktop devices
- Print-friendly styling

## Prerequisites

Node.js must be installed on system.

## Installation

1. Clone repository:

```bash
git clone https://github.com/kylebtran/soundscapes.git
cd soundscapes
```

2. Install dependencies:

```bash
npm install
```

3. Build CSS:

```bash
npm run build:css
```

## Dependencies

- **EJS**: JavaScript templating
- **Express**: Web application framework
- **Express EJS Layouts**: EJS-Express layout support
- **Tailwind CSS**
- **GSAP**
- **axios**
- **dotenv**

- **nodemon**
- **Jest**: JavaScript testing

## Development

To start development server:

```bash
npm start
```

## Testing

To run Jest tests:

```bash
npm test
```

## Challenges and Solutions

- **Framework**: Transitioning from React to EJS required reimplementing certain framework-level features manually. EJS layouts and partials were leveraged to maintain code separation and reusability familiar in modern frontend frameworks.
- **Dynamic Search**: Initial client-side search result rendering using direct innerHTML injection promoted XSS vulnerabilities and poor modularity. This was resolved by implementing server-side rendering with EJS partials and Express, resulting in improved maintainability and usage of technology.
- **Testing Infrastructure**: Implementing comprehensive Jest testing required establishing robust setup/teardown procedures as application complexity grew. Black-box testing methodology was set up for desired features.
- **API Reliability**: Deezer API's availability during international travel over winter break necessitated implementing a local caching system with timestamp-based invalidation and extracted demo tracks for offline development
