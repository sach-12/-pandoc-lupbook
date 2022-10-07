typedef struct node {
    int data;
    struct node *next;
} node;

typedef struct list {
    struct node *head;
} list;

list *list_new();
node *node_new();
int list_push_front(list *l, node *n);
