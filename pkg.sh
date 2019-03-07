#!/bin/bash
OS="$(uname -s)"

rm -rf ./pkg 

if [ "$(expr substr $OS 1 5)" == "Linux" ]; then
    echo "Building for Linux..."

    # linux x64
    OUTPUT_DIR=chattervox-linux-x64
    pkg --out-path "pkg/${OUTPUT_DIR}" \
        --targets node8-linux-x64 . && \
        cp node_modules/serialport/build/Release/serialport.node "pkg/${OUTPUT_DIR}"

    pushd pkg
    tar -zcvf "${OUTPUT_DIR}.tar.gz" "${OUTPUT_DIR}"
    popd

    # linux x86
    OUTPUT_DIR=chattervox-linux-x86
    pkg --out-path "pkg/${OUTPUT_DIR}" \
        --targets node8-linux-x86 . && \
        cp node_modules/serialport/build/Release/serialport.node "pkg/${OUTPUT_DIR}"

    pushd pkg
    tar -zcvf "${OUTPUT_DIR}.tar.gz" "${OUTPUT_DIR}"
    popd
elif [ "$OS" == "Darwin" ]; then
    echo "Building for MacOS..."

    # MacOS
    OUTPUT_DIR=chattervox-macos
    pkg --out-path "pkg/${OUTPUT_DIR}" \
        --targets node8-macos-x64 . && \
        cp node_modules/serialport/build/Release/serialport.node "pkg/${OUTPUT_DIR}"

    pushd pkg
    tar -zcvf "${OUTPUT_DIR}.tar.gz" "${OUTPUT_DIR}"
    popd
else
    echo "unsupported OS $OS, exiting."
fi