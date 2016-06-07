#!/bin/bash

shopt -s nullglob
TEXT=(tests_and_results/*.txt)
PPM=(tests_and_results/*.ppm)

for file in $TEXT; do
	./raytracer $file
done

for ppm in $PPM; do
	open $ppm
done

