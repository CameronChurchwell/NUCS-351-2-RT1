type InputCallback = (arg: Event) => void;

//TODO add more to this
export const InputTypes = ["keyUp", "keyDown", "keyPress"] as const;
type InputType = typeof InputTypes[number];

export type CallbackMap = Map<InputType, InputCallback>

export interface InputReciever {
    callbackMap: CallbackMap;
}

export class InputContextManager {
    managedObjects: InputReciever[];
    active: boolean;
    callbackMap: Map<InputType, InputCallback[]>;

    constructor(managedObjects: InputReciever[]) {
        this.managedObjects = managedObjects;
        this.active = false;

        
        //read in hooks
        this.callbackMap = new Map();
        for (let inputType of InputTypes) {
            this.callbackMap[inputType] = new Array();
            for (let managedObject of managedObjects) {
                if (managedObject.callbackMap.has(inputType)) {
                    let callback = managedObject.callbackMap.get(inputType);
                    this.callbackMap[inputType].push(callback);
                }
            }
        }
    }

    generateCallback(kind: InputType) {
        let individualCallbacks = this.callbackMap[kind];
        return (ev: Event) => {
            if (this.active) { //TODO does this actually work? does it stay updated?
                for (let callback of individualCallbacks) {
                    callback(ev);
                }
            }
        }
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    toggleActive() {
        this.active = !this.active;
    }
}