import React from 'react';
import KanbanBoard from './KanbanBoard/KanbanBoard';
import { fromJS, toJS, set } from 'immutable';
import 'whatwg-fetch';
const API_URL = 'http://kanbanapi.pro-react.com';
const API_HEADERS = {
  'Content-Type': 'application/json',
};

class KanbanContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: []
    };

    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.toggleTask = this.toggleTask.bind(this);
    this.updateCardStatus = this.updateCardStatus.bind(this);
    this.updateCardPosition = this.updateCardPosition.bind(this);
  }

  updateCardStatus(cardId, listId) {
    let prevState = fromJS(this.state.cards);

    let cardIndex = this.state.cards.findIndex(card => card.id === cardId);
    let card = prevState.get(cardIndex);
    card = card.set('status', listId);

    let nextState = prevState.set(cardIndex, card);

    if(card.status !== listId) {
      this.setState({
        cards: nextState.toJS()
      });
    }
  }

  updateCardPosition(cardId, afterId) {
    if(cardId === afterId) {
      return;
    }

    let prevState = fromJS(this.state.cards);

    let cardIndex = this.state.cards.findIndex(card => card.id === cardId);
    let card = prevState.get(cardIndex);

    let afterIndex = this.state.cards.findIndex(card => card.id ===afterId);

    let nextState = prevState.delete(cardIndex);
    nextState = nextState.insert(afterIndex, card);
    this.setState({
      cards: nextState.toJS()
    });
    
  }

  addTask(cardId, taskName) {
    let cardIndex = this.state.cards.findIndex(card => card.id === cardId);
    let prevState = fromJS(this.state.cards);

    let newTask = {
      id: Date.now(),
      name: taskName,
      done: false
    };

    let newTasks = prevState.getIn([cardIndex,"tasks"]);
    newTasks = newTasks.push(newTask);

    let nextState = prevState.setIn([cardIndex, 'tasks'], newTasks.toJS());

    this.setState({
      cards: nextState.toJS()
    });

    fetch(API_URL+'/cards/'+cardId+'/tasks', {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(newTask)
    })
    .then(response => {
      if(response.ok) {
        return response.json()
      } else {
        throw new Error('Server response wasn\'t OK');
      }
    })
    .then(response => {
      console.log('Add success', response);
    })
    .catch(error => {
      console.log('Error', error);
      this.setState({
        cards: prevState.toJS()
      });
    });
  }

  removeTask(cardId, taskId, taskIndex) {
    let cardIndex = this.state.cards.findIndex(card => card.id === cardId);

    let prevState = fromJS(this.state.cards);

    let newTasks = prevState.getIn([cardIndex,"tasks"]);
    newTasks = newTasks.delete(taskIndex);

    let nextState = prevState.setIn([cardIndex, 'tasks'], newTasks.toJS());

    this.setState({
      cards: nextState.toJS()
    });

    fetch(API_URL+'/cards/'+cardId+'/tasks/'+taskId,{
      method: 'DELETE',
      headers: API_HEADERS
    })
    .then(response => {
      if(response.ok) {
        console.log('Remove success ', response);
        return response;
      } else {
        throw new Error('Server response wasn\'t OK');
      }
    })
    .catch(error => {
      console.log('Error ', error);
      this.setState({
        cards: prevState.toJS()
      });
    });

  }

  toggleTask(cardId, taskId, taskIndex) {
    let cardIndex = this.state.cards.findIndex(card => card.id === cardId);
    let prevState = fromJS(this.state.cards);

    let newStatus;
    let updateTask = prevState.getIn([cardIndex,"tasks"]);
    updateTask = updateTask.updateIn([taskIndex,'done'], val=> {
      newStatus = !val;
      return newStatus;
    });

    let nextState = prevState.setIn([cardIndex, 'tasks'], updateTask.toJS());

    this.setState({
      cards: nextState.toJS()
    });

    fetch(API_URL+'/cards/'+cardId+'/tasks/'+taskId,{
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify({done:newStatus})
    })
    .then(response => {
      if(response.ok) {
        console.log('Update success ', response);
        return response;
      } else {
        throw new Error('Server response wasn\'t OK');
      }
    })
    .catch(error => {
      console.log('Error ', error);
      this.setState({
        cards: prevState.toJS()
      });
    });

  }

  componentDidMount() {
    fetch(API_URL+'/cards', {
      headers: API_HEADERS
    })
    .then(result => result.json())
    .then(result => {
      this.setState({
        cards: result
      });
    })
    .catch(err => {
      console.log('ERROR ---', err);
    });
  }

  render() {
    console.log('REMOVEME --- cards', this.state.cards);
    return(
      <div className="KanbanContainer">
        <button onClick={() => this.updateCardStatus(6941, 'in-progress')}>Update status</button>
        <button onClick={() => this.updateCardPosition(6940, 6941)}>Update position</button>
        <KanbanBoard
          taskCallbacks={{
            add: this.addTask,
            remove: this.removeTask,
            toggle: this.toggleTask
          }}
          cards={this.state.cards}/>
      </div>
    );
  }
}

export default KanbanContainer;
