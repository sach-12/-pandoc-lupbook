#include <stdlib.h>
#include "list.h"

list *list_new() {
    list *l = malloc(sizeof(struct list));
    if (!l)
        return NULL;

    l->head = NULL;

    return l;
}

node *node_new(int data) {
    node *n = malloc(sizeof(struct node));
    if (!n)
        return NULL;

    n->data = data;
    n->next = NULL;

    return n;
}

int list_push_front(list *l, node *n) {

    if (l == NULL || n == NULL)
        return -1;

    n->next = l->head;
    l->head = n;

    return 0;
}
