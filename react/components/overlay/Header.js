import React, { useCallback, useState } from 'react';
import { ImageBackground, Text } from "react-native";
import { useTheme, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { headerStyle } from '../../styles/App';
import UI from '../../services/ui/UI';

export default Header = ({style, title}) => {
    const [header, setState] = useState({
        source: null
    });

    const { dark, colors } = useTheme();

    useFocusEffect (
        useCallback(() => {
            const headerListener = UI.addListener(
                UI.EVENT_HEADER,
                state => setState(state)
            );

            return () => headerListener.remove();
        }, [])
    );

    return (
        <ImageBackground style={[headerStyle.container, style]}
                         imageStyle={{height: "100%", position: "absolute"}}
                         source={header.source}>
            <LinearGradient style={[headerStyle.gradient, header.source == null ? {backgroundColor: colors.card} :headerStyle.imageFound]}
                            colors={
                                dark ? gradientColorsDark
                                     : gradientColors
                            }>
                <Text style={[headerStyle.text, {color: colors.text}]}>
                    {title}
                </Text>
            </LinearGradient>
        </ImageBackground>
    )
}

const gradientColors = ['rgba(242, 242, 242, 0.2)', 'rgba(242, 242, 242, 0.5)', 'rgba(242, 242, 242, 0.8)', 'rgba(242, 242, 242, 1)'];
const gradientColorsDark = ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 1)'];