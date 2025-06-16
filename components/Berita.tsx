import { Article } from '@/constants/article';
import icons from '@/constants/icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: Article;
  onPress?: () => void;
}

export const Artikel = ({ item, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress} className='flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative'>

      <View className='flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50 '>
        <Image source={icons.star} className='size-2.5'/>
        <Text className='text-xs font-rubik-bold text-primary-300 ml-0.5'>4.4</Text>
      </View>

      <Image 
        source={{ uri: item.image }} 
        className='w-full h-40 rounded-lg'
        resizeMode="cover"
      />

      <View className='flex flex-col mt-2'>
          <Text className='text-base font-rubik-bold text-black-300'>
            {item.title}
          </Text>
          <Text className='text-xs font-rubik text-black-200 mt-1'>
            {item.description}
          </Text>
      </View>
    </TouchableOpacity>
  )
}
