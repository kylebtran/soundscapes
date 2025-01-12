class Track {
  constructor() {
    this.playButton = document.getElementById("play");
    this.currentAudio = null;
    this.isPlaying = false;

    const itemData = JSON.parse(
      document.getElementById("item-data").textContent
    );
    this.previewUrl = itemData.preview;

    this.playButton.addEventListener("click", () => this.togglePlay());
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stopAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      this.currentAudio = new Audio(this.previewUrl);
      this.currentAudio.play();
      this.isPlaying = true;
      this.playButton.textContent = "STOP";

      this.currentAudio.addEventListener("ended", () => {
        this.stopAudio();
      });
    } catch (error) {
      console.error("Playback error:", error);
    }
  }

  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.isPlaying = false;
    this.playButton.textContent = "PREVIEW";
    this.currentAudio = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Track();
});
