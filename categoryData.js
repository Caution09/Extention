let categoryData = {
  data: [[], [], []],
  update: function() {
    let addedValues = {0: new Set(), 1: new Set(), 2: new Set()};
    this.data= [[], [], []]
      localPromptList.forEach(item => {
      for (let i = 0; i < 3; i++) {
        const hasValue = addedValues[i].has(item.data[i]);
        let isAdd = !hasValue || !this.data[i].some(check => check.value === item.data[i] && check.parent === item.data[i-1]);
        if(isAdd){
          addedValues[i].add(item.data[i]);
          const pushData = {value: item.data[i]};
          if (i > 0) {
            pushData.parent = item.data[i-1];
          }
          this.data[i].push(pushData);
        }
      }
    });
    
    masterPrompts.forEach(item => {
      for (let i = 0; i < 3; i++) {
        const hasValue = addedValues[i].has(item.data[i]);
        let isAdd = !hasValue || !this.data[i].some(check => check.value === item.data[i] && check.parent === item.data[i-1]);
        if(isAdd){
          addedValues[i].add(item.data[i]);
          const pushData = {value: item.data[i]};
          if (i > 0) {
            pushData.parent = item.data[i-1];
          }
          this.data[i].push(pushData);
        }
      }
    });
    setCategoryList("#search-cat0",0)
    console.log(this);
  }
};
