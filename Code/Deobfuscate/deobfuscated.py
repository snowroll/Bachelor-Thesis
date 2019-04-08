#-*- coding:utf-8 -*- 
#chaihj 2019/04/01

import jsbeautifier
import sys

filename = sys.argv[1]

opts = jsbeautifier.default_options()
opts.unescape_strings = True

res = jsbeautifier.beautify_file(filename, opts=opts)

print(res)