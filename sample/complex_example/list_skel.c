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

    // TODO: finish the function so that n becomes the first node in l,
    // preceding all existing nodes

}
