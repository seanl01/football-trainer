# Football Trainer

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Fully client-side football training tool for reaction stimulus during individual training. Try out [here.](https://seanl01.github.io/football-trainer)

## Background

This project started off to meet my own training needs. I found that it was difficult to simulate any unpredictable stimulus when training on my own. The conjecture is that involving some sort of random stimulus in training improves decision making during games. At the same time, I also wanted to sharpen my web development skills, particularly with the use of WebRTC. This project offered me the opportunity to do both.

## Features

### A. Individual reaction training
This feature allows the user to test their reactions by flashing an icon at random time intervals within a user-specified range. Together with the icon, a left or right arrow is also flashed as additional stimulus. The user can customise the icon to be flashed as well as toggle "speech mode" to receive an audible verbal command for "left" or "right".

### B. Paired Device training

This feature allows the user to pair two devices, acting as dynamic indicators for the user to react to. Once paired, a randomly selected device will "flash" with a symbol, and the user must react to it. The devices can be set up in different locations and can be used in a variety of training scenarios. For example, the user can place devices at two different sides and practice dribbling or passing to the device that lights up.

#### **Implementation**

The pairing is performed using WebRTC. The sequence is as follows:

1. Both peers generate offer QR codes.
1. The peer whose QR code is first scanned becomes the leader.
1. Upon scanning the leader's QR code, the follower generates an answer QR code.
1. The leader scans the answer QR code.

> We differentiate a leader scanning from a follower scanning by the SDP type field. One is an offer and one is an answer

## Installation and setup
1. Clone the repo
2. Run `bun install` or `npm install`
3. Run `bun run start` or `npm run start` to start the dev server
