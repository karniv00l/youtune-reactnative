import React, { PureComponent } from 'react';

import {
    Text,
    ScrollView,
    TouchableOpacity
} from "react-native";
import { navigatorStyle } from '../../styles/Library';

export default class LibraryNavigator extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            selection: 0
        }

        global.setLibraryNavigator = (selection) => {
            if (this.state.selection != selection)
                this.setState({selection: selection});
        };
    }

    getStyle = (value) => {
        if (value == this.state.selection)
            return navigatorStyle.focus;
        else
            return navigatorStyle.entry;
    }

    getTextStyle = (value) => {
        if (value == this.state.selection)
            return navigatorStyle.focusText;
        else
            return navigatorStyle.entryText;
    }

    update = (value) => {
        if (value != this.state.selection) {
            if (value == 0)
                this.props.navigation.navigate("Library", {screen: "Playlists"});
            else if (value == 1)
                this.props.navigation.navigate("Library", {screen: "Albums"});
            else if (value == 2)
                this.props.navigation.navigate("Library", {screen: "Songs"});
            else if (value == 3)
                this.props.navigation.navigate("Library", {screen: "Artists"});
            else if (value == 4)
                this.props.navigation.navigate("Library", {screen: "Subscriptions"});
            
            this.setState({selection: value});
        }
    };

    render() {
        return (
            <ScrollView style={navigatorStyle.container} horizontal={true} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity onPress={() => {this.update(0)}} style={this.getStyle(0)}>
                    <Text style={this.getTextStyle(0)}>PLAYLISTS</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {this.update(1)}} style={this.getStyle(1)}>
                    <Text style={this.getTextStyle(1)}>ALBUMS</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {this.update(2)}} style={this.getStyle(2)}>
                    <Text style={this.getTextStyle(2)}>SONGS</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {this.update(3)}} style={this.getStyle(3)}>
                    <Text style={this.getTextStyle(3)}>ARTISTS</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {this.update(4)}} style={this.getStyle(4)}>
                    <Text style={this.getTextStyle(4)}>SUBSCRIPTIONS</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }
}