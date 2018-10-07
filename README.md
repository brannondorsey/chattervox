# Chattervox

[![Travis CI Build Image](https://travis-ci.com/brannondorsey/chattervox.svg?branch=master)](https://travis-ci.com/brannondorsey/chattervox) [![Coverage Status](https://coveralls.io/repos/github/brannondorsey/chattervox/badge.svg?branch=master)](https://coveralls.io/github/brannondorsey/chattervox?branch=master)

An AX.25 packet radio chat protocol with support for digital signatures and binary compression. Like IRC over radio waves 📡.

Chattervox implements a minimal [packet radio protocol](#the-protocol) on top of AX.25 that can be used with a terminal node controller (TNC) like [Direwolf](https://github.com/wb2osz/direwolf) to transmit and receive digitally signed messages using audio frequency shift keying modulation (AFSK). In the United States, it's illegal to broadcast encrypted messages on amateur radio frequencies. Chattervox respects this law, while using elliptic curve cryptography and digital signatures to protect against message spoofing.

With amateur packet radio anyone can pretend to be anyone else. With Chattervox, you can be sure you're chatting with the person you intend to. For more information, check out the [FAQ](FAQ.md) or the discussion about chattervox on [hackernews](https://news.ycombinator.com/item?id=18058031).

> **UPDATE** (September 24th, 2018): Please understand that this software is in **beta** and I ask for your patience until development stabilizes. While I'm very excited to see that interest in the project is high, It's quite unexpected and I have spent very little time testing the software (aside from automated tests). If you have a problem, [please submit a detailed issue](https://github.com/brannondorsey/chattervox/issues) and I'll have a look. I'll be writing a tutorial explaining how to get up and running with chattervox very soon.

![Baofeng UV-5R Linux setup](.images/baofeng.jpg)

## Prerequisites

Chattervox requires a linux computer and a serial connection to a TNC to send and receive AX.25 packets. I recommend using [Direwolf](https://github.com/wb2osz/direwolf), a popular software TNC which can be run on the same computer hosting the `chattervox` application.

You'll also need a radio and a cable to connect the microphone and speaker from the radio to your linux machine. I recommend the following equipment, especially if you're on a budget:

- $24 Baofeng UV-5R 4-watt radio. This is the absolute best radio you can buy for that price.
- $18 [BTech APRS cable](https://www.amazon.com/BTECH-APRS-K1-Interface-APRSDroid-Compatible/dp/B01LMIBAZW&keywords=btech+aprs+cable) (3.5mm TRRS to 3.5mm and 2.5mm audio cable)

You can also make the cable yourself if you prefer. Check out [this zine](https://books.vvvvvvaria.org/read/41/pdf) for instructions. 

Finally, to operate legally on amateur radio frequencies, you'll need an amateur radio license.

## Download

Binary downloads are available for Linux x64 and x86 architectures on the [releases page](https://github.com/brannondorsey/chattervox/releases).

If you have `npm`, that is the preferred method of install as it allows for the easiest upgrade to the latest version. If you prefer to "build" it from Typescript source and run it as a Node.js app, you can do that as well.

### NPM 

```bash
npm install --cli -g chattervox@latest 
```

Installing a node package globally may require `sudo`. If you get a permission denied error, try running the install command again with `sudo npm ...`.

### Source

```bash
# clone the repo
git clone https://github.com/brannondorsey/chattervox
cd chattervox

# download dependencies
npm install

# transpile the src/*.ts typescript files to build/*.js
npm run build

# run chattervox from source to opening the chat room
node build/main.js chat
```

### Binary Downloads

[Binary downloads](https://github.com/brannondorsey/chattervox/releases) are packaged via [Pkg](https://github.com/zeit/pkg). Chattervox uses a native Node.js addon for serial port communication but Pkg [does not yet support](https://github.com/zeit/pkg#native-addons) bundling `.node` bindings in their binaries. Therefore, the `serialport.node` file that comes with the download must live in the same folder as the `chattervox` binary. If you want to install chattervox globally on your machine you can maintain this relationship by placing `chattervox` in your PATH using a symlink, or copying both `chattervox` and `serialport.node` to `/usr/local/bin` or wherever your OS looks for programs.

## Usage

```bash
# open the chat room
chattervox chat

# send a packet from the command-line
chattervox send "this is a chattervox packet sent from the command-line."

# receive *all* packets and print them to stdout
chattervox receive --allow-all

# generate a new public/private key pair, and use it as your default signing key
chattervox genkey --make-signing

# add a friend's public key to your keyring, so that chattervox can verify their messages
chattervox addkey KC3LZO 0489a1d94d700d6e45508d12a4eb9be93386b5b30feb2b4aa07836398781e3d444e04b54a6e01cf752e54ef423770c00a6

# remove a friend's public key if it has become compromised 
chattervox removekey KC3LZO 0489a1d94d700d6e45508d12a4eb9be93386b5b30feb2b4aa07836398781e3d444e04b54a6e01cf752e54ef423770c00a6

# print all keys in your keyring
chattervox showkey
```

```
usage: chattervox [-h] [-v] [--config CONFIG]
                  {chat,send,receive,showkey,addkey,removekey,genkey} ...

An AX.25 packet radio chat protocol with support for digital signatures and 
binary compression. Like IRC over radio waves 📡〰.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  --config CONFIG, -c CONFIG
                        Path to config file (default: /home/braxxox/.
                        chattervox/config.json)

subcommands:
  {chat,send,receive,showkey,addkey,removekey,genkey}
```

## The Protocol

The chattervox packet is primitive and straightforward. It contains a simple header, an optional ECDSA digital signature, and a message payload that can be in plaintext or compressed. As of packet version 1, the protocol is connectionless. There is only one type of packet and there is no mechanism for delivery confirmation (think of it like UDP). It is expected to be transported via AX.25 Unnumbered Information (UI) packets, which the chattervox program relies on for sender and recipient information, as no such fields exists in the packet itself to conserve space.

The protocol may be amended in the future to add new features, however, its simplicity should not be seen as a weakness. The goal of chattervox is singular: **Add cryptographic verifiability to text-based radio communication.**

For proposed changes to the protocol [view the open RFCs](https://github.com/brannondorsey/chattervox/issues?q=is%3Aissue+is%3Aopen+label%3ARFC).

### Chattervox Protocol v1 Packet 


| Byte Offset       | # of Bits     | Name                                | Value              | Description 
| ----------------- | ------------- | ----------------------------------- | ------------------ | ----------- 
| 0x0000            | 16            | Magic Header                        | 0x7a39             | A constant two-byte value used to identify chattervox packets.
| 0x0002            | 8             | Version Byte                        | Number             | A protocol version number between 1-255.
| 0x0003            | 6             | Unused Flag Bits                    | Null               | Reserved for future use.
| 0x0003            | 1             | Digital Signature Flag              | Bit                | A value of 1 indicates that the message contains a ECDSA digital signature.
| 0x0003            | 1             | Compression Flag                    | Bit                | A value of 1 indicates that the message payload is compressed.
| [0x0004]          | [8]           | [Signature Length]                  | Number             | The length in bytes of the digital signature. This field is only included if the Digital Signature Flag is set.
| [0x0004 or 0x0005]| [0-2048]      | [Digital Signature]                 | Bytes              | The ECDSA digital signature created using a SHA256 hash of the message contents and the sender's private key.
| 0x0004-0x104      | 0-∞           | Message                             | Bytes              | The packet's UTF-8 message payload. If the Compression Flag is set the contents of this buffer is a [raw DEFLATE buffer](https://nodejs.org/api/zlib.html#zlib_zlib_deflateraw_buffer_options_callback) containing the UTF-8 message.

[] indicates an optional field.

### TypeScript chattervox client

This repository serves as the first implementation of the protocol. The `chattervox` command-line tool acts as a client to send and receive chattervox packets in combination with a TNC. This implementation creates a new ECDSA keypair the first time it's run and includes a digital signature for each message (so long as there remains a `signingKey` in `~/.chattervox/config.json`). Each message is temporarily compressed by the client before it's sent in an attempt to measure the efficiency of the DEFLATE compression algorithm. If the compressed version is smaller than the uncompressed version, the compressed buffer is used as the message payload and the compression bit is set in the chattervox packet. If the plaintext version is smaller, no compression is used and the original message text is used as the payload.