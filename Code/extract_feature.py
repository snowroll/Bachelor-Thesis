#-*- coding:utf-8 -*-
import re
filename = "benign.txt"

comment = r'[^:]//(.*)'  # 短注释
comment_long = r'/\*(.*?)\*/'  # 长注释
comment_words = 0
call = r'[a-zA-Z0-9_]+\([a-zA-Z0-9_, \-\'\"]*\)'  # 方法调用
argument = r'[a-zA-Z0-9_]+\((.*?)\)'  # 方法参数
operators = ["+", "-", "*", "/", "=", "+=", "*=", "%=", "/=", "-=", "++", "--"]
len_characters = 0
script_str = ""
with open(filename, 'r') as f:
    lines = 0
    comment_num = 0
    for i in f:
        com = re.findall(comment, i, re.S | re.M) # 单行注释
        if len(com):
            comment_num += 1
            for i in com:
                comment_words += len(i.split())
        lines += 1
        script_str += i
        len_characters += len(i)
    per_line = len_characters / lines  # 每行的字符数
    tokens = script_str.split()
    string_num = len(tokens)  # 单词个数
    avg_string = len_characters / string_num  # 每个单词平均长度
    white_space = script_str.count(" ") / len_characters  # 空白字符占比
    com2 = re.findall(comment_long, script_str, re.S | re.M)  # 多行注释
    for i in com2:
        comment_num += i.count("\n")  # comment
        comment_words += len(i.split())  # comment的数量
    avg_comment = comment_num / lines  # 平均每行的comment数量
    per_comment = 1 - comment_words / string_num  # 不在comment中的单词占比
    operator_num = 0
    for i in operators:
        operator_num += script_str.count(i)
    methods = re.findall(call, script_str, re.S | re.M)  # 方法调用
    methods_num = len(methods)
    argument_len = 0
    for i in methods:
        arguments = re.findall(argument, i, re.S | re.M)  # 方法参数
        for j in arguments:
            if len(j):
                argument_len += len(j)
                # print(j)
    per_argument = argument_len / methods_num  # 每个方法的平均参数长度
    print(methods_num, per_argument)
    print("operator_num", operator_num)
    print(comment_num, avg_comment, per_comment)
    print(len_characters, lines, per_line, avg_string, white_space)

