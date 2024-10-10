const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const fsExtra = require('fs-extra');
const { execSync } = require('child_process'); // To use execSync for running ffprobe

// Define text styles and configurations
const textStyles = {
    title: {
        fontfile: './KaiseiHarunoUmi-Regular.ttf', // Path to the font file
        fontcolor: 'white',
        fontsize: 56,
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
        stroke: 1,
        strokecolor: 'black',
        box: 1,
        boxcolor: 'black@0.5',
        yPercent: 0.1, // Y position as a percentage of video height
        xPosition: 'center', // Can be 'left', 'center', or 'right'
    },
    part1: {
        fontfile: './KaiseiHarunoUmi-Regular.ttf', // Path to the font file
        fontcolor: 'white',
        fontsize: 48,
        shadowcolor: 'black',
        shadowx: 1,
        shadowy: 1,
        stroke: 1,
        strokecolor: 'black',
        box: 3,
        boxcolor: 'black@0.7',
        yPercent: 0.4, // Y position for Part 1
        xPosition: 'center', // Part 1 position
    },
    part2: {
        fontfile: './KaiseiHarunoUmi-Regular.ttf', // Path to the font file
        fontcolor: 'white',
        fontsize: 48,
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
        stroke: 1,
        strokecolor: 'black',
        box: 3,
        boxcolor: 'black@0.7',
        yPercent: 0.5, // Y position for Part 2
        xPosition: 'left', // Part 2 position
    },
};

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
fsExtra.ensureDirSync(outputDir);

// Load CSV data
const data = [];
fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (row) => {
        data.push(row);
    })
    .on('end', () => {
        processVideos();
    });

// Default values
const DEFAULT_AUDIO = 'lds.mp3'; // Default audio file
const DEFAULT_VIDEO = 'waterfall1.mp4'; // Default video file
const DEFAULT_START_TIME = '0';
const DEFAULT_END_TIME = '15'; // Default duration in seconds
const DEFAULT_INJECT_TIME = '6'; // Default time to inject Part 2

const PADDING_PERCENT = 0.05; // Padding for x position

// Utility functions
const getVideoDimensions = (videoPath) => {
    try {
        // Wrap the videoPath in quotes to handle spaces
        const output = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`);
        const [width, height] = output.toString().trim().split(',').map(Number);
        return { width, height };
    } catch (error) {
        console.error(`Error getting video dimensions: ${error.message}`);
        return { width: 1920, height: 1080 }; // Default fallback
    }
};

const getYPosition = (videoHeight, yPercent) => {
    return Math.round(videoHeight * yPercent);
};

const getXPosition = (videoWidth, xPosition, textWidth) => {
    const padding = Math.round(videoWidth * PADDING_PERCENT);
    switch (xPosition) {
        case 'left':
            return padding; // Padding from the left
        case 'right':
            return videoWidth - textWidth - padding; // Padding from the right
        case 'center':
        default:
            return Math.round((videoWidth - textWidth) / 2); // Centered
    }
};
const addTextFilters = (filters, text, yPosition, xPosition, textStyles, videoWidth) => {
    const words = text.split(' ');
    let currentLine = '';
    
    // Calculate padding and usable width
    const padding = Math.round(videoWidth * PADDING_PERCENT);
    const maxWidth = videoWidth - padding * 2; // Subtract padding from both sides
    const wrappedText = [];

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidthEstimate = testLine.length * textStyles.fontsize * 0.6; // Estimate text width based on character length

        // Check if the new line exceeds max width
        if (textWidthEstimate > maxWidth) {
            wrappedText.push(currentLine);
            currentLine = word; // Start new line
        } else {
            currentLine = testLine; // Keep adding to the current line
        }
    }

    // Push any remaining text
    if (currentLine) {
        wrappedText.push(currentLine);
    }

    const finalText = wrappedText.join('\n'); // Use '\n' for line breaks

    const textWidthEstimate = finalText.length * textStyles.fontsize * 0.6; // Re-calculate width for positioning
    const xPos = getXPosition(videoWidth, xPosition, textWidthEstimate);

    const textFilter = {
        filter: 'drawtext',
        options: {
            fontfile: textStyles.fontfile,
            text: finalText, // Use wrapped text with actual line breaks
            fontsize: textStyles.fontsize,
            fontcolor: textStyles.fontcolor,
            x: xPos,
            y: yPosition,
            shadowcolor: textStyles.shadowcolor,
            shadowx: textStyles.shadowx,
            shadowy: textStyles.shadowy,
            box: textStyles.box ? 1 : 0,
            boxcolor: textStyles.boxcolor,
        },
    };
    filters.push(textFilter);
};

// Core processing functions
function processVideos() {
    data.forEach((row) => {
        const {
            Title,
            Part_1: part1,
            Part_2: part2,
            Audio: audioFile,
            Video: videoFile,
            Start_Time: start_time = DEFAULT_START_TIME,
            End_Time: end_time = DEFAULT_END_TIME,
            Inject_Time: inject_time = DEFAULT_INJECT_TIME,
        } = row;

        const videoPath = path.join(__dirname, 'video', videoFile || DEFAULT_VIDEO);
        const audioPath = path.join(__dirname, 'audio', audioFile || DEFAULT_AUDIO);
        const outputFile = path.join(outputDir, `${Title.replace(/\s+/g, '_')}.mp4`);

        // Check if input video file exists
        if (!fs.existsSync(videoPath)) {
            console.error(`Video file not found: ${videoPath}`);
            return; // Skip this row
        }
        // Check if input audio file exists
        if (!fs.existsSync(audioPath)) {
            console.error(`Audio file not found: ${audioPath}`);
            return; // Skip this row
        }

        // Get video dimensions
        const { width: videoWidth, height: videoHeight } = getVideoDimensions(videoPath);

        // Construct FFmpeg command with filter specs
        const videoFilters = [];

        // Add title text filter
        const yTitle = getYPosition(videoHeight, textStyles.title.yPercent); // Calculate Y position based on height
        addTextFilters(videoFilters, Title, yTitle, textStyles.title.xPosition, textStyles.title, videoWidth);

        // Add part 1 text filter
        const yPart1 = getYPosition(videoHeight, textStyles.part1.yPercent);
        addTextFilters(videoFilters, part1, yPart1, textStyles.part1.xPosition, textStyles.part1, videoWidth);

        // Add part 2 text filter with enable condition
        const yPart2 = getYPosition(videoHeight, textStyles.part2.yPercent);
        addTextFilters(videoFilters, part2, yPart2, textStyles.part2.xPosition, textStyles.part2, videoWidth);
        videoFilters[videoFilters.length - 1].options.enable = `between(t,${inject_time},${inject_time + 5})`;

        // Run FFmpeg
        ffmpeg(videoPath)
            .input(audioPath)
            .outputOptions([
                `-ss ${start_time}`, // Start time for trimming
                `-to ${end_time}`, // End time for trimming
                '-map 0:v:0', // Use the video stream from the original video file
                '-map 1:a:0', // Use the audio stream from the new audio file
                '-shortest',
            ])
            .videoFilters(videoFilters)
            .on('end', () => {
                console.log(`Processed: ${outputFile}`);
            })
            .on('error', (err) => {
                console.error(`Error processing ${outputFile}: ${err.message}`);
            })
            .save(outputFile);
    });
}
