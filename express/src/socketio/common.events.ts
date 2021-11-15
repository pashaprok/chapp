import { appSocketIO } from '../app';
import { CHAT_INFO } from '../constants/socketio';

export function chatInfo(message) {
  appSocketIO.emit(CHAT_INFO, message);
}
