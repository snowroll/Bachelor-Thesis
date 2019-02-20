#-*- coding:utf-8 -*-
import re
filename = "benign.txt"

js_keywords = []
keyword_dict = {}
with open("features.txt", 'r') as f:  # js语言的关键字作为特征
    for i in f:
        js_keywords.append(i.strip("\n"))

comment = r'[^:]//(.*)'  # 短注释
comment_long = r'/\*(.*?)\*/'  # 长注释
repet = r'([0-9a-zA-Z])\1{1,}'
comment_words = 0
call = r'[a-zA-Z0-9_]+\([a-zA-Z0-9_, \-\'\"]*\)'  # 方法调用
argument = r'[a-zA-Z0-9_]+\((.*?)\)'  # 方法参数
_hex = r'[0\\]x[0-9a-fA-F]+'  # 16进制数
operators = ["+", "-", "*", "/", "=", "+=", "*=", "%=", "/=", "-=", "++", "--"]
len_characters = 0
script_str = ""

def isreadable(word):  # 判断一个单词是否可读
    if len(word) > 30:
        return False
    alpha_num = 0
    vowel_num = 0
    vowel = 'aeiou'
    for i in word:
        if i.isalpha():
            alpha_num += 1
        if i in vowel:
            vowel_num += 1
    if alpha_num / len(word) < 0.7 or vowel_num / len(word) < 0.2 or vowel_num / len(word) > 0.6:
        return False
    repeat_words = re.findall(repet, word, re.S | re.M)
    if len(repeat_words) > 2:
        return False
    return True

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

    per_argument = argument_len / methods_num  # 每个方法的平均参数长度
    read_num = 0  # 可读单词比例
    for i in tokens:
        if isreadable(i):
            read_num += 1
    ratio_read = read_num / string_num

    hexadecimal_num = len(re.findall(_hex, script_str, re.S | re.M))  # 16进制的个数

    for i in js_keywords:
        keyword_dict[i] = script_str.count(i)
    
    features_dict = {"len_characters": len_characters, "per_line": per_line, "lines": lines, "string_num": string_num, \
        "hexadecimal_num": hexadecimal_num, "ratio_read": ratio_read, "white_space": white_space, "methods_num": methods_num, \
        "avg_string": avg_string, "avg_comment": avg_comment, "comment_num": comment_num, "per_comment": per_comment, \
        "operator_num": operator_num, "per_argument": per_argument}

    features_dict.update(keyword_dict)  # 合并关键词特征和计算后的特征

    print(features_dict)

