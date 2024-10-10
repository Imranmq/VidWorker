# FFmpeg Bulk Video Editor with Dynamic Text Overlay

This project provides a Node.js script that automates video editing using FFmpeg. It allows you to overlay dynamic text (such as titles, subtitles, and custom messages) on videos based on data from a CSV file. The script supports text styling, dynamic word wrapping, and precise text positioning.

## Features

- **Bulk Video Processing**: Process multiple videos by reading data from a CSV file.
- **Dynamic Text Overlay**: Add text overlays to videos, such as titles and subtitles, with custom styles (font, color, size, etc.).
- **Flexible Positioning**: Position text based on percentages of the video's height and width (center, left, right).
- **Word Wrapping**: Automatically break long text into multiple lines based on the video's width.
- **Supports Audio Replacement**: Inject new audio files into the videos.
- **Trim Video**: Trim videos based on start and end times defined in the CSV file.
- **Text Animations**: Enable text display based on timing (e.g., delayed appearance for certain text parts).
- **Multiple Video Formats**: Handles multiple input video formats (MP4, AVI, etc.).

## Requirements

- **Node.js** (v12+)
- **FFmpeg** and **FFprobe** must be installed and available in your system's PATH.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Imranmq/VidWorker.git
    cd ffmpeg-bulk-video-editor
    ```

2. Install the required dependencies:
    ```bash
    npm install
    ```

3. Ensure that FFmpeg and FFprobe are installed on your system. You can check with the following commands:
    ```bash
    ffmpeg -version
    ffprobe -version
    ```

## Usage

1. Place your video files in the `video/` directory and audio files in the `audio/` directory.
2. Create or modify the `data.csv` file in the root directory to define the text, timings, and file references.

Example `data.csv` structure:
```csv
Title,Part_1,Part_2,Audio,Video,Start_Time,End_Time,Inject_Time
"Sample Title","This is Part 1","This is Part 2","audio1.mp3","video1.mp4","0","10","5"
