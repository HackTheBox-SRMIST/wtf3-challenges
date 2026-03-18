TARGET = vuln
SRC    = vuln.c

all:
	gcc -o $(TARGET) $(SRC) \
		-fno-stack-protector \
		-no-pie \
		-z lazy

clean:
	rm -f $(TARGET)
