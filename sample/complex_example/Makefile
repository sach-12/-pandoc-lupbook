PROG = exmp_list

all: $(PROG)

%.o: %.c
	gcc -c -o $@ $<

$(PROG): main.o list_key.o
	gcc $^ -o $@

clean:
	rm -f *.o
	rm -f $(PROG)
