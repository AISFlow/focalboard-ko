// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import './adminPage.scss'
import client from '../octoClient'
import {IUser} from '../user';
import Sidebar from '../components/sidebar/sidebar';

const AdminPage = () => {

    const [users, setUsers] = useState<IUser[]>([]);

    const fetchUsers = async () => {
        const result = await client.getTeamUsers();
        setUsers(result)
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className='AdminPage'>
            <Sidebar onBoardTemplateSelectorOpen={function (): void {
                throw new Error('Function not implemented.');
            } }/>
            <div className='panel'>
            <h1 className='tite'>Team Users</h1>
            <p>Users count: {users.length}</p>
                <ul className='users-list'>
                    {users.map((user) => (
                        <li key={user.id}>
                        {user.username}
                        </li>
                    ))}
            </ul>
            </div>
        </div>
    );
};

export default React.memo(AdminPage)
