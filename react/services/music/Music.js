import { DeviceEventEmitter } from 'react-native';
import TrackPlayer, { Capability, RepeatMode, Event, State } from 'react-native-track-player';
import Queue from 'queue-promise';
import Downloads from '../device/Downloads';
import Cast from './Cast';
import API from '../api/API';

export default class Music {
    static playbackState = State.None;
    static set state(value) {
        this.playbackState = value;
        this.#emitter.emit(this.EVENT_STATE_UPDATE, this.state);
    }

    static get state() {
        return this.playbackState;
    }

    static playbackPosition = 0;
    static set position(value) {
        this.playbackPosition = value;
        this.#emitter.emit(this.EVENT_POSITION_UPDATE, this.position);
    }

    static get position() {
        return this.playbackPosition;
    }

    static #positionInterval = null;
    static #positionListener = null;
    static isStreaming = false;

    static repeatMode = RepeatMode.Off;
    static get repeatModeString() {
        if (this.repeatMode == RepeatMode.Off)
            return "repeat";
        else if (this.repeatMode == RepeatMode.Queue)
            return "repeat-on";
        else
            return "repeat-one-on";
    }

    static metadataList = [];
    static metadataIndex = 0;
    static set index(value) {
        this.metadataIndex = value;
        this.#emitter.emit(this.EVENT_METADATA_UPDATE, this.metadata);
    }

    static get index() {
        return this.metadataIndex;
    }

    static playlistId = null;
    static trackUrlLoaded = [];

    static transitionTrack;
    static set transition(value) {
        this.transitionTrack = value;
        if (value)
            this.#emitter.emit(this.EVENT_METADATA_UPDATE, value);
    }

    static get transition() {
        return this.transitionTrack;
    }

    static get metadata() {
        if (Music.metadataList.length == 0)
            if (Music.transition)
                return Music.transition;
            else
                return {id: null, playlistId: null, title: null, artist: null, artwork: null, duration: 0};
        else
            return Music.metadataList[Music.index];
    }

    static wasPlayingBeforeSkip = false;

    static #emitter = DeviceEventEmitter;
    static EVENT_METADATA_UPDATE = "event-metadata-update";
    static EVENT_POSITION_UPDATE = "event-position-update";
    static EVENT_STATE_UPDATE = "event-state-update";

    static audioContext;

    static TrackPlayerTaskProvider = () => {
        return async function() {
            TrackPlayer.addEventListener(Event.PlaybackState, params => {
                if (Music.isStreaming)
                    return clearInterval(Music.#positionInterval)

                if (params.state != State.Playing) {
                    clearInterval(Music.#positionInterval);
                    TrackPlayer.getPosition().then(position => Music.position = position);
                } else if (params.state != Music.state) {
                    Music.#positionInterval = setInterval(async() =>
                        Music.position = await TrackPlayer.getPosition()
                    , 500);
                }
                
                if (!Music.metadata.id)
                    return;
                
                Music.state = params.state;
            });
    
            TrackPlayer.addEventListener(Event.PlaybackTrackChanged, params => {
                if (Music.isStreaming)
                    return;

                if (Music.index != params.nextTrack) {
                    Music.index = params.nextTrack;
                    Music.position = 0;
                }

                if (params.nextTrack < Music.metadataList.length - 1 && params.nextTrack >= 0) {
                    if (!Music.trackUrlLoaded[params.nextTrack]) {
                        Music.#queue.enqueue(() => {
                            return new Promise(async(resolve, reject) => {
                                let track = Music.metadataList[params.nextTrack];
                                track.url = await Music.getStream({videoId: track.id});
                                resolve(track);
                            });
                        });
                    } else {
                        Music.play();
                    }
                }
            });
    
            TrackPlayer.addEventListener(Event.PlaybackQueueEnded, params => {
                //console.log(Event.PlaybackQueueEnded);
                //console.log(params);
            });
    
            TrackPlayer.addEventListener(Event.PlaybackError, params => {
                //console.log(Event.PlaybackError);
                //console.log(params);
                /*TrackPlayer.seekTo(0).then(() => {
                    TrackPlayer.play();
                });*/
            });
    
            TrackPlayer.addEventListener(Event.RemoteNext, params => {
                Music.skipNext();
            });
    
            TrackPlayer.addEventListener(Event.RemotePrevious, params => {
                Music.skipPrevious();
            });
    
            TrackPlayer.addEventListener(Event.RemotePlay, params => TrackPlayer.play());
    
            TrackPlayer.addEventListener(Event.RemotePause, params => TrackPlayer.pause());
    
            TrackPlayer.addEventListener(Event.RemoteStop, params => TrackPlayer.stop());
    
            TrackPlayer.addEventListener(Event.RemoteSeek, params => {
                TrackPlayer.seekTo( ~~(params.position) );
            });
    
            TrackPlayer.addEventListener(Event.RemoteJumpForward, async() => {
                let position = await TrackPlayer.getPosition();
                let duration = await TrackPlayer.getDuration();
                position += 10;
                if (position > duration) position = duration;
    
                TrackPlayer.seekTo(position);
            });
    
            TrackPlayer.addEventListener(Event.RemoteJumpBackward, async() => {
                let position = await TrackPlayer.getPosition();
                position -= 10;
                if (newPosition < 0) position = 0;
    
                TrackPlayer.seekTo(position);
            });
        }
    };

    static #queue = new Queue({
        concurrent: 5,
        interval: 1
    });

    static addListener(event, listener) {
        return Music.#emitter.addListener(event, listener);
    }

    static play = () => {
        if (Music.isStreaming)
            Cast.play();
        else {
            if (Music.audioContext)
                Music.audioContext.resume();
            TrackPlayer.play();
        }
    }

    static pause = () => {
        if (Music.isStreaming)
            Cast.pause();
        else
            TrackPlayer.pause();
    }

    static reset = async(dontResetTransition) => {
        if (!Music.isStreaming)
            await TrackPlayer.reset();

        Music.metadataList = [];
        Music.index = 0;
        Music.position = 0;

        Music.state = State.None;
        if (!dontResetTransition)
            Music.transition = undefined;
    }

    static seekTo = position => {
        Music.position = position;
        if (Music.isStreaming)
            Cast.seekTo(position);
        else {
            TrackPlayer.seekTo(position);
            clearInterval(Music.#positionInterval);
            Music.#positionInterval = setInterval(async() =>
                Music.position = await TrackPlayer.getPosition()
            , 500);
        }
    }

    static initialize = () => {
        return new Promise(async(resolve, reject) => {
            TrackPlayer.registerPlaybackService(Music.TrackPlayerTaskProvider);
            await TrackPlayer.setupPlayer({});
            await TrackPlayer.updateOptions(TrackPlayerOptions);
            TrackPlayer.setRepeatMode(Music.repeatMode);

            Music.#queue.on("reject", error => console.log(error));
            Music.#queue.on("resolve", async(track) => {
                if (!Music.metadataList?.length || Music.state == State.None)
                    return;

                let trackIndex = -1;
                for (let i = 0; i < Music.metadataList.length; i++) {
                    if (Music.metadataList[i].id == track.id) {
                        trackIndex = i;
                        break;
                    }
                }

                if (trackIndex == -1)
                    return;

                await TrackPlayer.remove(trackIndex);
                await TrackPlayer.add(track, trackIndex);
                Music.trackUrlLoaded[trackIndex] = true;

                if (Music.metadata.id != track.id)
                    return;

                Music.skip(trackIndex);
            });

            Cast.initialize();
            Cast.addListener(Cast.EVENT_CAST, e => {
                if (e.castState == "CONNECTED") {
                    if (!Music.isStreaming) {
                        Music.isStreaming = true;
                        TrackPlayer.reset();
                        clearInterval(Music.#positionInterval);

                        Music.#positionListener = Cast.addListener(
                            Cast.EVENT_POSITION,
                            pos => Music.position = pos
                        );
                    }
                } else {
                    if (!Music.isStreaming)
                        return;

                    Music.isStreaming = false;
                    Music.#positionListener.remove();
                    if (Music.metadataList.length > 0)
                        Music.startPlaylist({
                            list: Music.metadataList,
                            index: Music.index
                        }, Music.position);
                }
            });

            Cast.addListener(Cast.EVENT_PLAYERSTATE, e => {
                Music.state = e;
            });

            resolve();
        });
    }

    static cycleRepeatMode = () => {
        if (Music.repeatMode == RepeatMode.Off)
            Music.repeatMode = RepeatMode.Queue;
        else if (Music.repeatMode == RepeatMode.Queue)
            Music.repeatMode = RepeatMode.Track;
        else if (Music.repeatMode == RepeatMode.Track)
            Music.repeatMode = RepeatMode.Off;
        
        TrackPlayer.setRepeatMode(Music.repeatMode);
        return Music.repeatModeString;
    }

    static skipTo(index) {
        if (index == null || Music.metadataList == null)
            return;

        let forward;
        if (index < 0) {
            if (Music.repeatMode == RepeatMode.Queue) {
                index = Music.metadataList.length - 1;
                forward = false;
            } else
                index = 0;
        } else if (index + 1 > Music.metadataList.length) {
            if (Music.repeatMode == RepeatMode.Queue) {
                index = 0;
                forward = true;
            } else
                index = Music.metadataList.length - 1;
        }
        
        forward = forward != undefined
            ? forward
            : index > Music.index;

        if (!forward && Music.position >= 10)
            return Music.seekTo(0)
        
        if (Music.trackUrlLoaded[Music.index]) {
            Music.skip(index);
        } else {
            if (!Music.isStreaming)
                Music.#queue.enqueue(() => {
                    return new Promise(async(resolve, reject) => {
                        let track = Music.metadataList[Music.index];
                        track.url = await Music.getStream({videoId: track.id});
                        resolve(track);
                    });
                });
            else
                Music.skip(index);
        }
    }

    static skip(index) {
        if (Music.isStreaming) {
            Music.index = index;
            Cast.cast();
        } else {
            TrackPlayer.skip(index);
        }
    }
    
    static skipNext() {
        Music.skipTo(Music.index + 1);
    }

    static skipPrevious() {
        Music.skipTo(Music.index - 1);
    }

    static getStream({videoId}) {
        if (Downloads.isTrackDownloaded(videoId))
            return Downloads.getStream(videoId);
        else
            return API.getAudioStream({videoId});
    }

    static getMetadata({videoId}) {
        if (Downloads.isTrackCached(videoId))
            return Downloads.getTrack(videoId);
        else
            return API.getAudioInfo({videoId});
    }

    static handlePlayback = async(track, forced) => {
        Music.transition = track;
        const { id, playlistId } = track;

        let queue = Music.metadataList;
        if (forced) {
            if (queue.length > 0) {
                let track = Music.metadata;

                if (playlistId == track.playlistId) {
                    if (track.id == id)
                        return;
                    
                    for (let i = 0; i < queue.length; i++) {
                        if (queue[i].id == id)
                            return Music.skip(i);
                    }
                }

                Music.reset(true).then(() => Music.state = State.Buffering);
            }
        } else
            Music.state = State.Buffering;
        

        let local = false;
        if (typeof playlistId == "string")
            if (playlistId.startsWith("LOCAL"))
                local = true;

        if (local) {
            Downloads.loadLocalPlaylist(playlistId, id)
                .then(localPlaylist => Music.startPlaylist(localPlaylist))
                .catch(_ => console.log(_));
        } else {
            API.getNextSongs({videoId: id, playlistId})
                .then(resultPlaylist => Music.startPlaylist(resultPlaylist))
                .catch(_ => console.log(_));
        }
    }

    static async startPlaylist(playlist, position) {
        Music.metadataList = playlist.list;
        Music.trackUrlLoaded = Array(playlist.list.length).fill(false);

        for (let i = 0; i < playlist.list.length; i++) {
            if (i == playlist.index)
                Music.index = i;

            if (i == playlist.index || i == playlist.index + 1) {
                if (Downloads.isTrackDownloaded(playlist.list[i].id) || !playlist.list[i].duration) {
                    playlist.list[i] = await Music.getMetadata({videoId: playlist.list[i].id});
                    playlist.list[i].id = playlist.list[i].videoId;
                    playlist.list[i].videoId = undefined;
                }

                playlist.list[i].url = await Music.getStream({videoId: playlist.list[i].id});
                Music.trackUrlLoaded[i] = true;
            }

            if (i == playlist.index + 1)
                break;
        }

        if (!Music.isStreaming) {
            await TrackPlayer.add(playlist.list);
            await TrackPlayer.skip(Music.index);
            if (position)
                await TrackPlayer.seekTo(position);

            Music.play();
        } else {
            Cast.cast();
        }
    }
}

const TrackPlayerOptions = {
    stopWithApp: true,
    alwaysPauseOnInterruption: true,

    capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo
    ],

    notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo
    ],

    compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
    ]
};