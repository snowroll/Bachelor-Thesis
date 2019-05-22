#-*- coding:utf-8 -*-
#author chaihj  2019/05/22
#第二个机器学习的检测算法 机器学习之一 ADTree

from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

def read_data(filename):  # 读取训练数据
    Feature_Mat = []
    Label_Mat = []
    File_Mat = []
    data = pd.read_csv(filename)
    data_count = len(data)
    for i in range(data_count):
        row = pd.Series.tolist(data.iloc[i])
        Feature_Mat.append(row[2:])  # 暂时去掉关键词
        Label_Mat.append(row[1])
        File_Mat.append(row[0])
    Feature_Mat = np.array(Feature_Mat)
    Label_Mat = np.array(Label_Mat)
    File_Mat = np.array(File_Mat)
    return Feature_Mat, Label_Mat, File_Mat

def Norm_Data():
    train_X, train_Y, train_F = read_data('train_data.csv')
    test_X,  test_Y,  test_F  = read_data('test_data.csv')
    std = StandardScaler().fit(train_X)  #对数据标准化
    std_trainx = std.transform(train_X)
    std_testx  = std.transform(test_X)
    return std_trainx, train_Y, std_testx, test_Y, test_F

def ADTree():
    train_X, train_Y, test_X, test_Y, test_F = Norm_Data()
    clf = DecisionTreeClassifier()
    clf = clf.fit(train_X, train_Y)
    pred_Y = clf.predict(test_X)
    with open("ADTree_res.txt", 'w') as f: 
        for i in range(test_X.shape[0]):
            f.write(test_F[i] + " " + str(test_Y[i]) + " " + str(pred_Y[i]) + "\n")
        f.write("Accuracy: " + str(1 - (test_Y != pred_Y).sum() / test_X.shape[0]))
    print("ADTree，样本总数： %d 错误样本数 : %d" % (test_X.shape[0], (test_Y != pred_Y).sum()))
    
def main():
    ADTree()

if __name__ == "__main__":
    main()