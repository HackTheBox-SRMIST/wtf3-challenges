TARGET = funkation-vacation
SRC    = funkation-vacation.asm
OBJ    = funkation-vacation.o
LD     = linker.ld

all: $(TARGET)

$(OBJ): $(SRC)
	nasm -f elf64 $(SRC) -o $(OBJ)

$(TARGET): $(OBJ)
	ld -o $(TARGET) $(OBJ) -T $(LD)

clean:
	rm -f $(OBJ) $(TARGET)
