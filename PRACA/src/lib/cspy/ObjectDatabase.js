/**
 * @classdesc a class to manage the database of objects
 * @class
 */
export class ObjectDatabase {

    static classes = [];

    static instances = [];

    static classNames = [];

    static instanceNames = [];

    static id = 0;

    /**
     * method to get all objects in the database
     * @param {object} toRet - an optional object to store the result in, will create a new object if not provided
     * @returns {object} - a dictionary with class/instances names as keys and classes/instances as values
     */
    static getObjects(toRet = undefined) {
        if (!toRet) {
            toRet = {};
        }
        this.getClassDictionary(toRet);
        this.getInstanceDictionary(toRet);
        return (toRet);
    }

    /**
     * method to get all classes in the database
     * @param {object} toRet - an optional object to store the result in, will create a new object if not provided
     * @returns {object} - a dictionary with class names as keys and classes as values
     */
    static getClassDictionary(toRet = undefined) {
        if (!toRet) {
            toRet = {};
        }
        for (var i = 0; i < ObjectDatabase.classes.length; i++) {
            toRet[ObjectDatabase.classNames[i]] = ObjectDatabase.classes[i];
        }
        return (toRet);
    }

    /**
     * method to get all instances in the database
     * @param {object} toRet - an optional object to store the result in, will create a new object if not provided
     * @returns {object} - a dictionary with instance names as keys and instances as values
     */
    static getInstanceDictionary(toRet = undefined) {
        if (!toRet) {
            toRet = {};
        }
        for (var i = 0; i < ObjectDatabase.instances.length; i++) {
            toRet[ObjectDatabase.instanceNames[i]] = ObjectDatabase.instances[i];
        }
        return (toRet);
    }

    /**
     * method to add a class to the database
     * @param {object} cls - the class to add
     * @param {string} name - the name of the class (optional, if not provided, a name will be generated)
     */
    static addClass(cls, name = undefined) {
        ObjectDatabase.classes.push(cls);
        if (!name) {
            var tmp = new cls();
            name = tmp.getClassName();
            console.log(tmp.constructor);
        }
        ObjectDatabase.classNames.push(name);
    }

    /**
     * method to add an instance to the database
     * @param {object} inst - the instance to add
     * @param {string} name - the name of the instance (optional, if not provided, a name will be generated)
     */
    static addInstance(inst, name = undefined) {
        ObjectDatabase.instances.push(inst);
        if (name == undefined) {
            name = inst.getClassName().toLowerCase() + "_" + ObjectDatabase.id++;
        }
        ObjectDatabase.instanceNames.push(name);
    }

    /**
     * method to get a class by its name. Note that this is the last instance of the class name in the array. (multiple objects can have the same name in the current implementation)
     * @param {string} name - the name of the class
     * @returns {object}
     */
    static getClassByName(name) {
        return (ObjectDatabase.classes[ObjectDatabase.classNames.lastIndexOf(name)]);
    }

    /**
     * method to get an instance by its name. Note that this is the last instance of the class name in the array. (multiple objects can have the same name in the current implementation)
     * @param {string} name - the name of the instance
     * @returns {object}
     */
    static getInstanceByName(name) {
        return (ObjectDatabase.instances[ObjectDatabase.instanceNames.lastIndexOf(name)]);
    }

    /**
     * method to get the database as a JSON object
     * @returns {object} - a JSON object with classes and instances
     */
    static getJSON() {
        var toRet = {};
        // create a new array from classes after running toJSON
        var jClasses = ObjectDatabase.classes.map((cls) => cls.toJSON());
        for (var i = 0; i < jClasses.length; i++) {
            var cName = ObjectDatabase.classNames[i];
            if (cName) {
                jClasses[i]['variableName'] = cName;
            }
        }
        var jInstances = ObjectDatabase.instances.map((inst) => inst.instToJSON());
        for (var i = 0; i < jInstances.length; i++) {
            var cName = ObjectDatabase.instanceNames[i];
            if (cName) {
                jInstances[i]['variableName'] = cName;
            }
        }
        toRet['classes'] = jClasses;
        toRet['instances'] = jInstances;
        return (toRet);
    }

    /**
     * method to get the database as a JSON string
     * @returns {string} - a JSON string with classes and instances
     */
    static getJSONString() {
        return (JSON.stringify(ObjectDatabase.getJSON(), null, 2));
    }

    /**
     * method to parse a JSON string into the database
     * @param {string} jString - a JSON string with classes and instances
     */
    static parseJSONString(jString) {
        var json = JSON.parse(jString);
        var jClasses = json['classes'];
        var jInstances = json[['instances']];
        if (jClasses) {
            jClasses.forEach((jClass) => {
                var compiled = CSPYCompiler.compileFromJSON(jClass);
                ObjectDatabase.classes.push(compiled);
                if (jClass['variableName']) {
                    ObjectDatabase.classNames.push(jClass['variableName']);
                } else {
                    ObjectDatabase.classNames.push(undefined);
                }
            });

        }
        if (jInstances) {
            jInstances.forEach((jInst) => {
                var compiled = CSPYCompiler.compileInstanceFromJSON(jInst);
                ObjectDatabase.instances.push(compiled);
                if (jInst['variableName']) {
                    ObjectDatabase.instanceNames.push(jInst['variableName']);
                } else {
                    ObjectDatabase.instanceNames.push(undefined);
                }
            });

        }
    }
}