#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DATA_FILE "students.txt"
#define MAX_STUDENTS 1000
#define MAX_ID_LEN 31
#define MAX_NAME_LEN 63
#define MAX_INPUT_SIZE 4096

typedef struct {
    char id[MAX_ID_LEN + 1];
    char name[MAX_NAME_LEN + 1];
    double math;
    double english;
    double c_language;
} Student;

static Student students[MAX_STUDENTS];
static int student_count = 0;

static void json_escape(const char *src, char *dest, size_t size) {
    size_t i = 0;
    size_t j = 0;

    while (src[i] != '\0' && j + 2 < size) {
        unsigned char ch = (unsigned char)src[i];

        if (ch == '\\' || ch == '"') {
            if (j + 2 >= size) {
                break;
            }
            dest[j++] = '\\';
            dest[j++] = (char)ch;
        } else if (ch == '\n') {
            if (j + 2 >= size) {
                break;
            }
            dest[j++] = '\\';
            dest[j++] = 'n';
        } else if (ch == '\r' || ch == '\t') {
            if (j + 2 >= size) {
                break;
            }
            dest[j++] = '\\';
            dest[j++] = (ch == '\r') ? 'r' : 't';
        } else {
            dest[j++] = (char)ch;
        }
        i++;
    }

    dest[j] = '\0';
}

static void print_error(const char *message) {
    char escaped[512];
    json_escape(message, escaped, sizeof(escaped));
    printf("{\"success\":false,\"message\":\"%s\"}\n", escaped);
}

static void print_success_message(const char *message) {
    char escaped[512];
    json_escape(message, escaped, sizeof(escaped));
    printf("{\"success\":true,\"message\":\"%s\"}\n", escaped);
}

static void trim(char *text) {
    size_t len;
    size_t start = 0;

    if (text == NULL) {
        return;
    }

    len = strlen(text);
    while (len > 0 && (text[len - 1] == '\n' || text[len - 1] == '\r' || isspace((unsigned char)text[len - 1]))) {
        text[--len] = '\0';
    }

    while (text[start] != '\0' && isspace((unsigned char)text[start])) {
        start++;
    }

    if (start > 0) {
        memmove(text, text + start, strlen(text + start) + 1);
    }
}

static int read_stdin_payload(char *buffer, size_t size) {
    size_t total = 0;
    int ch;

    while ((ch = getchar()) != EOF) {
        if (total + 1 >= size) {
            break;
        }
        buffer[total++] = (char)ch;
    }

    buffer[total] = '\0';
    return (int)total;
}

static int get_payload_value(const char *payload, const char *key, char *out, size_t out_size) {
    char temp[MAX_INPUT_SIZE];
    char *line;
    char *context = NULL;
    size_t key_len = strlen(key);

    if (payload == NULL || key == NULL || out == NULL) {
        return 0;
    }

    strncpy(temp, payload, sizeof(temp) - 1);
    temp[sizeof(temp) - 1] = '\0';

    line = strtok_r(temp, "\n", &context);
    while (line != NULL) {
        char *eq = strchr(line, '=');
        if (eq != NULL) {
            *eq = '\0';
            trim(line);
            if (strlen(line) == key_len && strcmp(line, key) == 0) {
                strncpy(out, eq + 1, out_size - 1);
                out[out_size - 1] = '\0';
                trim(out);
                return 1;
            }
        }
        line = strtok_r(NULL, "\n", &context);
    }

    return 0;
}

static int parse_score(const char *text, double *score) {
    char *endptr;
    double value;

    if (text == NULL || score == NULL) {
        return 0;
    }

    value = strtod(text, &endptr);
    if (*text == '\0' || *endptr != '\0') {
        return 0;
    }
    if (value < 0.0 || value > 100.0) {
        return 0;
    }

    *score = value;
    return 1;
}

static double total_score(const Student *student) {
    return student->math + student->english + student->c_language;
}

static double subject_gpa(double score) {
    if (score >= 90.0) return 4.0;
    if (score >= 85.0) return 3.7;
    if (score >= 82.0) return 3.3;
    if (score >= 78.0) return 3.0;
    if (score >= 75.0) return 2.7;
    if (score >= 72.0) return 2.3;
    if (score >= 68.0) return 2.0;
    if (score >= 64.0) return 1.5;
    if (score >= 60.0) return 1.0;
    return 0.0;
}

static double average_gpa(const Student *student) {
    return (subject_gpa(student->math) + subject_gpa(student->english) + subject_gpa(student->c_language)) / 3.0;
}

static int load_students(void) {
    FILE *file = fopen(DATA_FILE, "r");
    char line[256];

    student_count = 0;
    if (file == NULL) {
        return 1;
    }

    while (fgets(line, sizeof(line), file) != NULL) {
        Student student;
        int scanned;

        if (student_count >= MAX_STUDENTS) {
            break;
        }

        trim(line);
        if (line[0] == '\0') {
            continue;
        }

        memset(&student, 0, sizeof(student));
        scanned = sscanf(
            line,
            "%31[^|]|%63[^|]|%lf|%lf|%lf",
            student.id,
            student.name,
            &student.math,
            &student.english,
            &student.c_language
        );

        if (scanned == 5) {
            students[student_count++] = student;
        }
    }

    fclose(file);
    return 1;
}

static int save_students(void) {
    FILE *file = fopen(DATA_FILE, "w");
    int i;

    if (file == NULL) {
        return 0;
    }

    for (i = 0; i < student_count; i++) {
        fprintf(
            file,
            "%s|%s|%.2f|%.2f|%.2f\n",
            students[i].id,
            students[i].name,
            students[i].math,
            students[i].english,
            students[i].c_language
        );
    }

    fclose(file);
    return 1;
}

static int find_student_index_by_id(const char *id) {
    int i;
    for (i = 0; i < student_count; i++) {
        if (strcmp(students[i].id, id) == 0) {
            return i;
        }
    }
    return -1;
}

static void print_student_json(const Student *student, int rank) {
    char escaped_id[128];
    char escaped_name[256];

    json_escape(student->id, escaped_id, sizeof(escaped_id));
    json_escape(student->name, escaped_name, sizeof(escaped_name));

    printf(
        "{\"id\":\"%s\",\"name\":\"%s\",\"math\":%.2f,\"english\":%.2f,\"cLanguage\":%.2f,\"total\":%.2f,\"gpa\":%.2f",
        escaped_id,
        escaped_name,
        student->math,
        student->english,
        student->c_language,
        total_score(student),
        average_gpa(student)
    );

    if (rank > 0) {
        printf(",\"rank\":%d", rank);
    }

    printf("}");
}

static void handle_list(void) {
    int i;
    printf("{\"success\":true,\"data\":[");
    for (i = 0; i < student_count; i++) {
        if (i > 0) {
            printf(",");
        }
        print_student_json(&students[i], 0);
    }
    printf("]}\n");
}

static void handle_add(const char *payload) {
    Student student;
    char math_text[64];
    char english_text[64];
    char c_text[64];

    if (student_count >= MAX_STUDENTS) {
        print_error("Student capacity reached.");
        return;
    }

    memset(&student, 0, sizeof(student));
    if (!get_payload_value(payload, "id", student.id, sizeof(student.id)) ||
        !get_payload_value(payload, "name", student.name, sizeof(student.name)) ||
        !get_payload_value(payload, "math", math_text, sizeof(math_text)) ||
        !get_payload_value(payload, "english", english_text, sizeof(english_text)) ||
        !get_payload_value(payload, "c_language", c_text, sizeof(c_text))) {
        print_error("Missing required fields.");
        return;
    }

    if (find_student_index_by_id(student.id) >= 0) {
        print_error("Student ID already exists.");
        return;
    }

    if (!parse_score(math_text, &student.math) ||
        !parse_score(english_text, &student.english) ||
        !parse_score(c_text, &student.c_language)) {
        print_error("Scores must be numbers between 0 and 100.");
        return;
    }

    students[student_count++] = student;
    if (!save_students()) {
        print_error("Failed to save students.txt.");
        return;
    }

    printf("{\"success\":true,\"message\":\"Student added successfully.\",\"data\":");
    print_student_json(&student, 0);
    printf("}\n");
}

static void handle_delete(const char *payload) {
    char id[MAX_ID_LEN + 1];
    int index;
    int i;

    if (!get_payload_value(payload, "id", id, sizeof(id))) {
        print_error("Missing student ID.");
        return;
    }

    index = find_student_index_by_id(id);
    if (index < 0) {
        print_error("Student not found.");
        return;
    }

    for (i = index; i < student_count - 1; i++) {
        students[i] = students[i + 1];
    }
    student_count--;

    if (!save_students()) {
        print_error("Failed to save students.txt.");
        return;
    }

    print_success_message("Student deleted successfully.");
}

static void handle_query(const char *mode, const char *payload) {
    char keyword[128];
    int i;
    int found = 0;

    if (!get_payload_value(payload, "keyword", keyword, sizeof(keyword))) {
        print_error("Missing query keyword.");
        return;
    }

    printf("{\"success\":true,\"data\":[");
    for (i = 0; i < student_count; i++) {
        int matched = 0;
        if (strcmp(mode, "id") == 0) {
            matched = (strcmp(students[i].id, keyword) == 0);
        } else if (strcmp(mode, "name") == 0) {
            matched = (strstr(students[i].name, keyword) != NULL);
        }

        if (matched) {
            if (found > 0) {
                printf(",");
            }
            print_student_json(&students[i], 0);
            found++;
        }
    }
    printf("]}\n");
}

static void handle_update(const char *payload) {
    char id[MAX_ID_LEN + 1];
    char field[32];
    char value[128];
    int index;

    if (!get_payload_value(payload, "id", id, sizeof(id)) ||
        !get_payload_value(payload, "field", field, sizeof(field)) ||
        !get_payload_value(payload, "value", value, sizeof(value))) {
        print_error("Missing update fields.");
        return;
    }

    index = find_student_index_by_id(id);
    if (index < 0) {
        print_error("Student not found.");
        return;
    }

    if (strcmp(field, "id") == 0) {
        if (find_student_index_by_id(value) >= 0 && strcmp(id, value) != 0) {
            print_error("New student ID already exists.");
            return;
        }
        strncpy(students[index].id, value, sizeof(students[index].id) - 1);
        students[index].id[sizeof(students[index].id) - 1] = '\0';
    } else if (strcmp(field, "name") == 0) {
        strncpy(students[index].name, value, sizeof(students[index].name) - 1);
        students[index].name[sizeof(students[index].name) - 1] = '\0';
    } else if (strcmp(field, "math") == 0) {
        if (!parse_score(value, &students[index].math)) {
            print_error("Invalid math score.");
            return;
        }
    } else if (strcmp(field, "english") == 0) {
        if (!parse_score(value, &students[index].english)) {
            print_error("Invalid english score.");
            return;
        }
    } else if (strcmp(field, "c_language") == 0) {
        if (!parse_score(value, &students[index].c_language)) {
            print_error("Invalid C language score.");
            return;
        }
    } else {
        print_error("Unsupported update field.");
        return;
    }

    if (!save_students()) {
        print_error("Failed to save students.txt.");
        return;
    }

    printf("{\"success\":true,\"message\":\"Student updated successfully.\",\"data\":");
    print_student_json(&students[index], 0);
    printf("}\n");
}

static void handle_stats(void) {
    int i;
    double math_sum = 0.0, english_sum = 0.0, c_sum = 0.0;
    double math_max = 0.0, english_max = 0.0, c_max = 0.0;
    double math_min = 0.0, english_min = 0.0, c_min = 0.0;
    int math_pass = 0, english_pass = 0, c_pass = 0;
    int math_excellent = 0, english_excellent = 0, c_excellent = 0;

    if (student_count > 0) {
        math_max = math_min = students[0].math;
        english_max = english_min = students[0].english;
        c_max = c_min = students[0].c_language;
    }

    for (i = 0; i < student_count; i++) {
        double math = students[i].math;
        double english = students[i].english;
        double c_language = students[i].c_language;

        math_sum += math;
        english_sum += english;
        c_sum += c_language;

        if (math > math_max) math_max = math;
        if (math < math_min) math_min = math;
        if (english > english_max) english_max = english;
        if (english < english_min) english_min = english;
        if (c_language > c_max) c_max = c_language;
        if (c_language < c_min) c_min = c_language;

        if (math >= 60.0) math_pass++;
        if (english >= 60.0) english_pass++;
        if (c_language >= 60.0) c_pass++;

        if (math >= 90.0) math_excellent++;
        if (english >= 90.0) english_excellent++;
        if (c_language >= 90.0) c_excellent++;
    }

    printf(
        "{\"success\":true,\"data\":{\"studentCount\":%d,"
        "\"math\":{\"average\":%.2f,\"highest\":%.2f,\"lowest\":%.2f,\"passRate\":%.2f,\"excellentRate\":%.2f},"
        "\"english\":{\"average\":%.2f,\"highest\":%.2f,\"lowest\":%.2f,\"passRate\":%.2f,\"excellentRate\":%.2f},"
        "\"cLanguage\":{\"average\":%.2f,\"highest\":%.2f,\"lowest\":%.2f,\"passRate\":%.2f,\"excellentRate\":%.2f}}}\n",
        student_count,
        student_count > 0 ? math_sum / student_count : 0.0,
        math_max,
        math_min,
        student_count > 0 ? (math_pass * 100.0 / student_count) : 0.0,
        student_count > 0 ? (math_excellent * 100.0 / student_count) : 0.0,
        student_count > 0 ? english_sum / student_count : 0.0,
        english_max,
        english_min,
        student_count > 0 ? (english_pass * 100.0 / student_count) : 0.0,
        student_count > 0 ? (english_excellent * 100.0 / student_count) : 0.0,
        student_count > 0 ? c_sum / student_count : 0.0,
        c_max,
        c_min,
        student_count > 0 ? (c_pass * 100.0 / student_count) : 0.0,
        student_count > 0 ? (c_excellent * 100.0 / student_count) : 0.0
    );
}

static int compare_student_indices(const void *left, const void *right) {
    int left_index = *(const int *)left;
    int right_index = *(const int *)right;
    double left_total = total_score(&students[left_index]);
    double right_total = total_score(&students[right_index]);

    if (left_total < right_total) return 1;
    if (left_total > right_total) return -1;
    if (students[left_index].math < students[right_index].math) return 1;
    if (students[left_index].math > students[right_index].math) return -1;
    return strcmp(students[left_index].id, students[right_index].id);
}

static void handle_ranking(void) {
    int indices[MAX_STUDENTS];
    int i;

    for (i = 0; i < student_count; i++) {
        indices[i] = i;
    }

    qsort(indices, student_count, sizeof(int), compare_student_indices);

    printf("{\"success\":true,\"data\":[");
    for (i = 0; i < student_count; i++) {
        if (i > 0) {
            printf(",");
        }
        print_student_json(&students[indices[i]], i + 1);
    }
    printf("]}\n");
}

static void handle_distribution(void) {
    int i;
    int range_90_100 = 0;
    int range_80_89 = 0;
    int range_70_79 = 0;
    int range_60_69 = 0;
    int range_0_59 = 0;

    for (i = 0; i < student_count; i++) {
        double average = total_score(&students[i]) / 3.0;
        if (average >= 90.0) {
            range_90_100++;
        } else if (average >= 80.0) {
            range_80_89++;
        } else if (average >= 70.0) {
            range_70_79++;
        } else if (average >= 60.0) {
            range_60_69++;
        } else {
            range_0_59++;
        }
    }

    printf(
        "{\"success\":true,\"data\":["
        "{\"label\":\"90-100\",\"count\":%d},"
        "{\"label\":\"80-89\",\"count\":%d},"
        "{\"label\":\"70-79\",\"count\":%d},"
        "{\"label\":\"60-69\",\"count\":%d},"
        "{\"label\":\"0-59\",\"count\":%d}]}\n",
        range_90_100,
        range_80_89,
        range_70_79,
        range_60_69,
        range_0_59
    );
}

static void handle_failing(void) {
    int i;
    int first_student = 1;

    printf("{\"success\":true,\"data\":[");
    for (i = 0; i < student_count; i++) {
        int has_failed = 0;
        char escaped_id[128];
        char escaped_name[256];
        int first_subject = 1;

        if (students[i].math < 60.0 || students[i].english < 60.0 || students[i].c_language < 60.0) {
            has_failed = 1;
        }

        if (!has_failed) {
            continue;
        }

        if (!first_student) {
            printf(",");
        }
        first_student = 0;

        json_escape(students[i].id, escaped_id, sizeof(escaped_id));
        json_escape(students[i].name, escaped_name, sizeof(escaped_name));

        printf("{\"id\":\"%s\",\"name\":\"%s\",\"failedSubjects\":[", escaped_id, escaped_name);
        if (students[i].math < 60.0) {
            printf("\"Math\"");
            first_subject = 0;
        }
        if (students[i].english < 60.0) {
            if (!first_subject) printf(",");
            printf("\"English\"");
            first_subject = 0;
        }
        if (students[i].c_language < 60.0) {
            if (!first_subject) printf(",");
            printf("\"C Language\"");
        }
        printf("]}");
    }
    printf("]}\n");
}

int main(int argc, char *argv[]) {
    char payload[MAX_INPUT_SIZE];

    memset(payload, 0, sizeof(payload));
    read_stdin_payload(payload, sizeof(payload));

    if (!load_students()) {
        print_error("Failed to load students.txt.");
        return 0;
    }

    if (argc < 2) {
        print_error("Missing command.");
        return 0;
    }

    if (strcmp(argv[1], "list") == 0) {
        handle_list();
    } else if (strcmp(argv[1], "add") == 0) {
        handle_add(payload);
    } else if (strcmp(argv[1], "delete") == 0) {
        handle_delete(payload);
    } else if (strcmp(argv[1], "query") == 0) {
        if (argc < 3) {
            print_error("Missing query mode.");
            return 0;
        }
        handle_query(argv[2], payload);
    } else if (strcmp(argv[1], "update") == 0) {
        handle_update(payload);
    } else if (strcmp(argv[1], "stats") == 0) {
        handle_stats();
    } else if (strcmp(argv[1], "ranking") == 0) {
        handle_ranking();
    } else if (strcmp(argv[1], "distribution") == 0) {
        handle_distribution();
    } else if (strcmp(argv[1], "failing") == 0) {
        handle_failing();
    } else {
        print_error("Unsupported command.");
    }

    return 0;
}
