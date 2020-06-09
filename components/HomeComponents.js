import React, {Component} from 'react';

import {
    Text,
    StyleSheet,
    ScrollView,
    View,
    Image,
    TouchableOpacity
} from "react-native";

import { Colors } from 'react-native/Libraries/NewAppScreen';

export class Results extends Component {
    constructor(){
        super();
    }

    openAlbum = (album) => {
        alert(album.title);
    }

    displayAlbum = (album) => {
        return (
            <View style={styles.album}>
                <TouchableOpacity onPress={() => {this.openAlbum(album)}}>
                    <Image style={styles.albumCover} source={{uri: album.thumbnail}}/>
                </TouchableOpacity>
                <Text style={styles.albumTitle}>{album.title}</Text>
                <Text style={styles.albumDesc}>{album.subtitle}</Text>
            </View>
        )
    }

    displayAlbums = (albums) => {
        return albums.map(this.displayAlbum);
    }

    displayShelf = (shelf) => {
        if (shelf.albums.length > 0) {
            return (
                <>
                    <Text style={styles.homeText}>{shelf.title}</Text>
                    <ScrollView style={styles.albumCollection} horizontal={true}>
                        {this.displayAlbums(shelf.albums)}
                    </ScrollView>
                </>
            )
        }
    }

    displayShelves = (result) => {
        return result.shelves.map(this.displayShelf);
    }

    displayHome = () => {
        console.log(JSON.stringify(this.props.passthroughHome));
        if (this.props.passthroughHome == null) {
            return (
                <View style={styles.preHome}>
                    <Text>Home</Text>
                </View>
            )
        } else {
            return (
                <View>
                    {this.displayShelves(this.props.passthroughHome)}
                </View>
            )
        }
    }

    render() {
        return (
            <ScrollView style={{height: '100%', flex: 1, flexDirection: 'column'}} contentContainerStyle={{ alignItems: 'center' }}>
                {this.displayHome()}
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    preHome: {
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        textAlign: 'center',
    },

    homeText: {
        fontWeight: 'bold',
        paddingLeft: 20,
        paddingTop: 15,
        fontSize: 20
    },

    albumCollection: {
        paddingTop: 20,
        paddingLeft: 20,
        paddingBottom: 5,
        marginBottom: 35
    },

    album: {
        marginRight: 20,
        width: 100,
        height: 160
    },

    albumCover: {
        height: 100,
        width: 100,
        backgroundColor: Colors.dark
    },

    albumTitle: {
        paddingTop: 5,
        fontSize: 10,
        fontWeight:'bold'
    },

    albumDesc: {
        fontSize: 10,
    }
});