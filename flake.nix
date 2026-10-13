{
  description = "Android development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = {
          android_sdk.accept_license = true;
          allowUnfree = true;
        };
      };
      androidComposition = pkgs.androidenv.composeAndroidPackages {
        buildToolsVersions = [ "35.0.0" "36.0.0" ];
        platformVersions = [ "35" "36" ];
        includeNDK = true;
        ndkVersions = [ "27.1.12297006" "27.0.12077973" ];
        abiVersions = [
          "arm64-v8a"
          "x86_64"
        ];
        cmakeVersions = [ "3.22.1" ];
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_24
          yarn
          jdk17
          androidComposition.androidsdk
          watchman
        ];

        GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidComposition.androidsdk}/libexec/android-sdk/build-tools/36.0.0/aapt2";

        shellHook = ''
          export ANDROID_SDK_ROOT="${androidComposition.androidsdk}/libexec/android-sdk"
          export ANDROID_HOME="$ANDROID_SDK_ROOT"
          export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk-bundle"
          export JAVA_HOME="${pkgs.jdk17}/lib/openjdk"
        '';
      };
    };
}
