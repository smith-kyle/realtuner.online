#!/usr/bin/env bash
# stream.sh – Pi camera → YouTube RTMP
# put your stream key in YT_KEY env var (export YT_KEY=xxxx-xxxx-xxxx)

libcamera-vid -t 0 --inline \
              --width 1920 --height 1080 --framerate 30 \
              -o - | \
ffmpeg -re -i - \
       -vcodec copy -acodec aac -b:a 128k \
       -f flv "rtmp://a.rtmp.youtube.com/live2/$YT_KEY"