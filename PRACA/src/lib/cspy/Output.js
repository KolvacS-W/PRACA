import {Input} from "./Input.js";

export class Output {

    params = {};

    constructor(vals = undefined) {
        this.setParameters(vals);
        if (vals) {
            if (!vals['outputtype']) {
                this.setParameter('outputtype', this.constructor.name);
            }
        }
    }


    static description(val) {
        var toRet = new Output();
        toRet.setParameter('description', val);
        return (toRet);
    }

    description(val) {
        this.setParameter('description', val);
        return (this);
    }

    getDescription() {
        if (this.params['description']) {
            return (this.params['description']);
        } else if (this.params['variableName']) {
            return (this.params['variableName']);
        } else {
            return ("");
        }
    }

    default(val) {
        this.setParameter('default', val);
        return (this);
    }

    getDefault() {
        return (this.params['default']);
    }

    explanation(val) {
        this.setParameter('explanation', val);
        return (this);
    }

    getExplanation() {
        return (this.params['explanation']);
    }

    type(val) {
        this.setParameter('type', val);
        // update the defaultValue to the type
        this.setParameter('default', this.params['default']);
        return (this);
    }

    getType() {
        return (this.params['type']);
    }

    async value(params = undefined) {
        return (this.params['default']);
    }

    name(val) {
        this.setParameter('variableName', val);
        return (this);
    }

    setParameter(key, value) {
        if (key == 'type') {
            value = Input.getType(this.params['default'], value);
            this.params[key] = value;
        } else if (key == 'default') {
            value = Input.convert(value, this.params['type']);
            this.params[key] = value;
            // if the type is undefined, set it to the type of the value
            if (!this.params['type']) {
                this.setParameter('type', undefined);
            }
        } else {
            this.params[key] = value;
        }
        return (this);
    }

    setParameters(params) {
        if (params) {
            Object.keys(params).forEach(name => {
                this.setParameter(name, params[name]);
            });
        }
        return (this);
    }

    static getType(defaultValue, type = undefined) {
        if (type) {
            return (type);
        } else {
            var ttype = typeof defaultValue;
            if (ttype == 'object') {
                ttype = 'string';
            }
            return (ttype);
        }
    }

    static convert(defaultValue, type) {
        if (defaultValue) {
            if (typeof defaultValue === 'string' || defaultValue instanceof String) {
                if (type == 'number') {
                    return (parseFloat(defaultValue))
                } else if (type == 'boolean') {
                    if ((/true/i).test(defaultValue)) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == 'JSON') {
                    return (JSON.parse(defaultValue));
                }
            }
        }
        return (defaultValue);
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new Output({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.params.description}: ${this.params.default} ${this.params.explanation} (${this.params.type})`;
    }

    clone() {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return (clone);
    }

    toJSON() {
        var toRet = {
            'description': this.params.description,
            'default': this.params.default,
            'explanation': this.params.explanation,
            'type': this.params.type,
            'outputtype': this.params.outputtype,
            'variableName': this.params.variableName
        };
        return (toRet);
    }
}

export class LLMOutput extends Output {

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new LLMOutput({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }
}