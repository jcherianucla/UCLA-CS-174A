.SILENT:

testFile=custom.txt

default:
	g++ -o raytrace -g raytrace.cpp

test: default
	rm -rf *.ppm
	killall "ToyViewer"
	./raytrace $(testFile)
	open -a "ToyViewer" *.ppm

clean:
	rm -rf raytrace
