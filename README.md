# fzuhelper-app

## Getting started

<details>
<summary><b>@renbaoshuo's local development environment [click to expand]</b></summary>

_Updated at Oct 24, 2024._

- Develop machine: Intel(R) Core(TM) Ultra 9 185H, 64 GiB RAM
- Operating system: Windows 11 Pro 23H2 (22631.4317)

| Software or tool name   | Version                                   |
| ----------------------- | ----------------------------------------- |
| Node.js                 | 20.14.0                                   |
| Android Studio          | 2024.1.2 (Koala Feature Drop)             |
| Android SDK             | 33 (Android 13.0)                         |
| NDK                     | 26.1.10909125                             |
| OpenJDK                 | 21.0.4+7 (winget Microsoft.OpenJDK.21)    |
| Android Studio Emulator | Pixel 8 Pro API 33 (Android 13.0, x86_64) |

</details>

Before you start, make sure you have [Node.js](https://nodejs.org/), [Yarn](https://yarnpkg.com/), and [Android Studio](https://developer.android.com/studio) installed on your computer.

Then create an Android Studio emulator, you can follow the instructions in the [Expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated).

After you have installed the required software, you can start developing the app.

Clone the repository and install dependencies:

```bash
git clone https://github.com/renbaoshuo/fzuhelper-app.git
cd fzuhelper-app
yarn install
```

Start the app:

```bash
yarn start
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).
