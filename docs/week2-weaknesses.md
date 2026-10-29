# Week 2 Ocular & Face Wake Check: Known Weaknesses

1. Extreme darkness (<0.10 lux) requires phone screen fill-light or immediate fallback to Math, as non-IR RGB sensors cannot distinguish pupil borders in zero ambient light.
2. Thick acetate eyeglass frames at acute side angles can partially occlude the outer canthus, reducing EAR confidence by up to 15%.
3. Upright posture detection is currently heuristic (v1 based on head pitch and face geometry); true torso and spine orientation requires the Week 3 pose model.
4. Aggressive third-party OEM keyguards (e.g., MIUI / HyperOS deep security locks) occasionally delay front camera preview over the lockscreen until first user touch.
5. Rapid head shaking (>45 deg/sec) causes momentary camera rolling-shutter motion blur, briefly resetting the continuous hold timer.
