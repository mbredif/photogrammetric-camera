function decode(file, type) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = () => { resolve(fr.result); };
        fr.onerror = () => { fr.abort(); reject(new DOMException('FileReader error.')); };
        switch(type) {
            case 'text': fr.readAsText(file); break;
            case 'arrayBuffer': fr.readAsArrayBuffer(file); break;
            case 'dataURL': fr.readAsDataURL(file); break;
            default: console.error('unknown decode type', type);
        }
    });
}

/** @module FilesSource */
class FilesSource {
  /** create a source with a read function that decodes a file from an array of files
   * @constructor
   * @param {string} options.path - path function that extracts the file name (default: basename)
   * @param {function} options.decode - function that decodes a File|Blob to the query type (default uses FileReader)
   * @return {function} - the fetching function (url => decoded).
   */
    constructor(files, options = {}) {
        this.path = options.path || (url => url.substr(url.lastIndexOf('/') + 1));
        this.files = {};
        for (let i = 0; i < files.length; ++i)
            this.files[files[i].name] = files[i];
        this.decode = options.decode || decode;
    }

    read(url, type) {
        return this.decode(this.files[this.path(url)], type);
    }
}

export default FilesSource;
