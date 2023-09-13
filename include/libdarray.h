#pragma once


template <typename T> 
struct sarray_t{
    T* buf;
    unsigned int count;
    unsigned int lim;
};

template <typename T> 
void sarray_clear(sarray_t<T> &a){
    a.count = 0;
}

template <typename T> 
void sarray_push(sarray_t<T> &a, T t){
    if(a.count >= a.lim) return;

    a.buf[a.count] = t;
    a.count++;
    return;
}

template <typename T> 
void sarray_pop(sarray_t<T> &a){
    if(a.count == 0) return;
    a.count--;
}

template <typename T> 
void sarray_insert(sarray_t<T> &a, T t, unsigned int i){
    if(i >= a.count) return sarray_push(a,t);

    for(int j=a.count; j>i; j--){
        auto aa = a.buf[j-1];
        a.buf[j] = aa;
    }
    a.buf[i] = t;
    a.count++;
    
    return;
}
template <typename T> 
void sarray_remove(sarray_t<T> &a, int i){
    if(a.count == 0) return;
    for(int j=i; j<(a.count); j++){
        auto aa = a.buf[j+1];
        a.buf[j] = aa;
    }
    a.count--;
}