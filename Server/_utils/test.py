import math


def split(a):
    n = math.ceil(len(a) / 25)
    k, m = divmod(len(a), n)
    return [a[i * k + min(i, m) : (i + 1) * k + min(i + 1, m)] for i in range(n)]

for num in range (10, 130, 5):
    print(f"{num:3}: {[len(x) for x in split(range(num))]}")