#!/bin/bash

rm -rf ./pkg 

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

