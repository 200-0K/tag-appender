# Tag Appender
<p align="center" >
  <img src="public/imgs/demo.gif" width="800">
</p>

Tag Appender is a cross-platform application with a user-friendly graphical interface that enables efficient tagging of images and videos. The app allows you to select a directory containing the media files you want to tag and then apply one or more tags to each file by appending the tags to the file name.

## Features
- **Media Support**: Tag both images and videos.
- **Tags Grouping**: Organize your tags into groups for better management.
- **Tags Reordering**: Drag and drop tags and groups to reorder them.
- **Move Tagged Media**: Automatically move files to a specific directory after tagging.
- **Undo Move**: Quickly undo a file move if you made a mistake.
- **Open Externally**: Open the current media file in your OS's default viewer using the eye icon.
- **Dark Mode**: Modern UI with dark theme support.
- **Auto Tagging**: Execute custom commands for automatic tagging.

## How to Use
### Selecting Tags
- **One Tag**: To add one tag, just left click the tag from the tag list.
- **Multiple Tags**: To add multiple tags, hold down the control key while clicking the tags to select them.

### Opening Media Externally
- Click the **eye icon** next to the file name input to open the current image or video in your system's default media viewer.

### Organizing Tags
- **Reordering**: You can drag and drop tags within a group or move them between groups. You can also reorder the groups themselves.
- **Grouping**: Tags can be grouped to keep your workspace organized.

### Moving Media
1. Click the folder icon to select a destination directory.
2. When you click the **Tag** button, the media file will be tagged and moved to the selected directory.
3. A check mark will appear next to the media if it has already been moved to the destination.
4. If you need to revert a move, click the **Undo** button.

### Auto Tagging
To enable automatic tagging for a media file, follow these steps:
1. Press **Ctrl + left click** on the 'Auto Tagging' button.
2. Enter the command to be executed to handle automatic tagging. The app will provide the current file path as the last argument for this command.
3. Click the 'Ok' button.
4. To tag a file automatically, left click the 'Auto Tagging' button on any media. The app will execute the command, reload the tags for the current file if the command is successful, and display an error message if it fails.

<p align="center" >
  <img src="public/imgs/auto-tagging.gif" width="800">
</p>

### Colors
- **Blue**: Denotes a new tag that will be added to the file.
- **Green**: Indicates that the file already has this tag.
- **Yellow**: Refers to tags that the file already has, but are not part of the pre-defined list of tags.

### Config File
To create the config file in the directory where you are currently running the application, include the `--current` flag when running the application.
