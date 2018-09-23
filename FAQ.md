# Frequently Asked Questions

## What is Packet Radio?

Packet radio is a form of packet switching technology used to transmit digital data via wireless communications. It uses a modem to encoded data as audio before it is mixed with a high-frequency carrier wave and transmitted over frequency modulated (FM) radio.

## Where can I learn more about packet radio?

In 2015, I participated in a fantastic packet radio workshop at the first Radical Networks conference in Brooklyn, NY. The workshop was lead by artists Dennis de Bel and Roel Roscam Abbing who created a small zine called [**Messing Around with Packet Radio**](https://books.vvvvvvaria.org/book/41) ([PDF](https://books.vvvvvvaria.org/download/41/pdf/41.PDF)). I can't recommend that text enough as a fun and non-standard introduction to the subject.

## What's the point of chattervox?

Chattervox adds cryptographic verifiability to text-based amateur radio communication. We've added built-in support for DEFLATE compression as a secondary goal for efficiency.

## What's a terminal node controller (TNC)?

A terminal node controller is a mechanism used to receive and transmit AX.25 amateur radio packets. Historically, they've been hardware devices that attach to and communicate with a host computer via a serial connection. These days, their functionality can be entirely implemented in software. [Direwolf](https://github.com/wb2osz/direwolf) is an example of a modern software TNC. TNCs have the capability to:

- Receive AX.25 packets and forward them over serial connections to applications that are listening for them
- Transmit AX.25 packets on behalf of client applications that request them via a serial connection
- Attempt to correct transmission errors in the AX.25 packets it receives
- Automatically manage interaction with a transmission channel, buffering the transmission of packets until the channel appears clear
- Be configured as a digipeater to automatically rebroadcast the AX.25 packets they receive and extend the range of the original sender's radio footprint
- Be configured as internet gateway devices, uploading packets they receive over the air to the internet

## How far can I communicate with chattervox?

The distance you can communicate depends on the transmission medium you are using. Messages are encoded and decoded using audio, so anything that can produce or receive audio is capable of sending or receiving chattervox messages. The trick is carrying that audio signal a great distance, and for that the solution is radio. VHF (30-300Mhz) and UHF (300Mhz-3Ghz) radio frequencies can carry signals 2-10+ miles depending on your location, antenna, output power, and propagation characteristics. HF frequencies (3-30Mhz) are capable of reaching several thousand miles, or across oceans. Hell, you could tunnel the audio connection over the internet if you really wanted. 

## Is this legal?

Yes! Well, it depends. If you broadcast digital data on the airwaves you have to make sure that you are allowed to do so. The legality general depends on:

- Where you are?
- Who you are?
- What frequencies you are using?

## What if I'm not a licensed amateur?

If you're not a licensed amateur you can still play around with chattervox! Chattervox uses audio to transmit messages, so you can use it independent of radio if you'd like. For instance, if you have a speaker and microphone, you can use it in a small room. Otherwise, you can probably use it over the internet as well by live streaming audio from your computer. If you are interested in using "on the air", there isn't a ton of unlicensed radio spectrum, at least in the US. You could probably get away with broadcasting on low power on FMRS (walky-talky) and MURS (Multi-use radio service) frequency bands without getting caught 😉, but technically digital modes are prohibited on those frequencies as well. Depending on where you are located, you may also be able to find equipment that operates in the unlicensed [industrial, scientific, and medical (ISM)](https://en.wikipedia.org/wiki/ISM_band) radio bands. 

All that said, obtaining a HAM license is pretty easy if you devote a few nights to [studying](https://hamstudy.org/). Once you've got a license you can legally use this protocol on tons of spectrum at high-power levels.

## What does chattervox use for digital signatures?

Chattervox uses elliptic curve cryptography to manage key signatures and verifications. Specifically, v1 of the packet protocol supports ECDSA using the NIST p192 curve implemented in [`elliptic`](https://github.com/indutny/elliptic/), a fast elliptic curve cryptography library for JavaScript. Signatures are created using a SHA-256 hash of a message's contents as well as the sender's private key. The receiver can then verify that the message was received without alteration and sent by the expected party using the received message and the sender's public key. All of this happens automatically by the `chattervox chat` application and the user is alerted if key signatures are not present or fail a verification check. The source code that manages digital signatures can be found in the [`src/Keystore.ts`](src/Keystore.ts) file.

## Is there receipt confirmation built into the protocol?

No. Chattervox is a connectionless protocol (at least as of packet version 1). This means that there is no acknowledgement process built into the protocol. Think of the chattervox protocol like UDP, instead of TCP in this way. This decision was made deliberately for simplicity, as the goal of the chattervox protocol is to **add cryptographic verifiability to text-based radio communication**.

## Why is it called "chattervox"?

VOX, or voice operated transmission, is a popular feature in some radios which allows for automatic TX when audio is detected using the microphone. This feature allows a radio tethered to a computer to automatically transmit data directly from a computer's audio output. Modem software running on the computer uses VOX to transmit without human involvement as is common with PTT (push-to-talk) TX. The combination of the words chatter and vox is a play on the words chatterbox (I'm sorry).