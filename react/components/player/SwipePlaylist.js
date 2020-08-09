import React, { Component } from "react";
import { Image, View, Text, StyleSheet, Pressable, Animated, Dimensions } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { skipTo } from "../../service";

export default class SwipePlaylist extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMinimized: true,
            scrollAnim: new Animated.Value(this.props.minimumHeight)
        };
    }

    scrollUp = () => {
        if (this.state.isMinimized) {
            this.setState({isMinimized: false});
            Animated.timing(this.state.scrollAnim, {
                toValue: Dimensions.get('window').height - 50,
                duration: 300,
                useNativeDriver: false
            }).start();
        }
        
    };
    
    scrollDown = () => {
        if (!this.state.isMinimized) {
            this.setState({isMinimized: true});
            Animated.timing(this.state.scrollAnim, {
                toValue: this.props.minimumHeight,
                duration: 300,
                useNativeDriver: false
            }).start();
        }
    };


    render() {
        const flatlist = <Animated.FlatList
                            style={[{height: this.state.scrollAnim}, this.props.style]}
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={!this.state.isMinimized}

                            onScroll={event => {
                                const currentOffset = event.nativeEvent.contentOffset.y;
                                const dif = currentOffset - (this.offset || 0);

                                if (dif < 0 && currentOffset < 10) {
                                    this.scrollDown();
                                    //scrollToOffset({animated: true, offset: 0});
                                }
                            }}

                            onScrollToTop={this.scrollDown}

                            data={this.props.playlist}

                            ListHeaderComponentStyle={stylesRest.topAlign}
                            ListHeaderComponent={
                                <Pressable onPress={this.scrollUp}>
                                    <View style={stylesRest.smallBar}/>
                                    <Text style={{color: "white"}}>WIEDERGABELISTE</Text>
                                </Pressable>
                            }

                            ListFooterComponentStyle={this.state.isMinimized ?{display: "none"} :stylesRest.topAlign}
                            ListFooterComponent={
                                <Pressable onPress={this.scrollDown}>
                                    <View style={stylesRest.smallBar}/>
                                </Pressable>
                            }

                            keyExtractor={item => item.id}
                            contentContainerStyle={{width: "100%", paddingHorizontal: 10}}
                            renderItem={({item, index}) => 
                                <Pressable style={{
                                                height: 50,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginVertical: 5
                                            }}

                                            onPress={() => skipTo(item.id)}
                                >
                                    {
                                        this.props.track.id == item.id
                                            ? <MaterialIcons style={{width: 30, textAlign: "center", textAlignVertical: "center"}} name="play-arrow" color="white" size={20}/>
                                            : <Text style={{width: 30, textAlign: "center", fontSize: 15, color: "white"}}>{index + 1}</Text>
                                    }

                                    <Image style={{height: 50, width: 50, marginRight: 10}} source={{uri: item.artwork}}/>

                                    <View style={{width: 0, flexGrow: 1, flex: 1}}>
                                        <Text style={{color: "white"}}>{item.title}</Text>
                                        <Text style={{color: "white"}}>{item.artist}</Text>
                                    </View>
                                </Pressable>
                            }/>

        return flatlist;
    }
}


const stylesRest = StyleSheet.create({
    playlistContainer: {height: 50, flexDirection: "row", width: "100%"},

    topAlign: {
        alignSelf: "center",
        marginBottom: 10
    },

    smallBar: {
        height: 4,
        width: 30,
        borderRadius: 2,
        backgroundColor: "white",
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 10
    }
});