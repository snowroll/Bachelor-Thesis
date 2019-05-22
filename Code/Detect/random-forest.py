#-*- coding:utf-8 -*-

import numpy as np
import matplotlib.pyplot as plt
from sklearn import svm, datasets, ensemble
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.externals import joblib

from sklearn.metrics import roc_curve, auc, roc_auc_score
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.grid_search import GridSearchCV
import pandas as pd

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
    train_X, train_Y, train_F = read_data('../Data/train_data/data.csv')
    test_X,  test_Y,  test_F  = read_data('../Data/test_data/data.csv')
    std = StandardScaler().fit(train_X)  #对数据标准化
    std_trainx = std.transform(train_X)
    std_testx  = std.transform(test_X)
    return std_trainx, train_Y, std_testx, test_Y, test_F

def Draw_ROC(test_Y, pred_Y):
    fpr, tpr, threshold = roc_curve(test_Y, pred_Y) ###计算真正率和假正率
    print('fpr ', fpr, 'tpr ', tpr, 'threshold', threshold)
    roc_auc = auc(fpr,tpr) ###计算auc的值

    plt.figure()
    lw = 2
    plt.figure(figsize=(10,10))
    plt.plot(fpr, tpr, color='darkorange',
            lw=lw, label='ROC curve (area = %0.2f)' % roc_auc) ###假正率为横坐标，真正率为纵坐标做曲线
    plt.plot([0, 1], [0, 1], color='navy', lw=lw, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver operating characteristic example')
    plt.legend(loc="lower right")
    plt.savefig("rf-roc.png")
    plt.show()

def Random_Forest():
    train_X, train_Y, test_X, test_Y, test_F = Norm_Data()
    # 开始训练 调参
    clf = RandomForestClassifier(n_estimators=50, min_samples_split=20 )
    clf.fit(train_X, train_Y)
    pred_Y = clf.predict(test_X)
    joblib.dump(clf, 'train_model.m')

    with open('random_forest_res.txt', 'w') as f:
        for i in range(len(test_Y)):
            f.write(str(test_F[i]) + " " + str(test_Y[i]) + " " + str(pred_Y[i]) + '\n')
        f.write("Accuracy: " + str(1 - (test_Y != pred_Y).sum() / test_X.shape[0]))
    Draw_ROC(test_Y, pred_Y)

def main():
    Random_Forest()

if __name__ == "__main__":
    main()
