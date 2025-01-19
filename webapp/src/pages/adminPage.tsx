// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useState} from 'react'

import './adminPage.scss'
import client from '../octoClient'
import {IUser} from '../user';
import Sidebar from '../components/sidebar/sidebar';
import BoardTemplateSelector from '../components/boardTemplateSelector/boardTemplateSelector';

const AdminPage = () => {

    const [users, setUsers] = useState<IUser[]>([]);
    const [boardTemplateSelectorOpen, setBoardTemplateSelectorOpen] = useState<boolean>(false)

    const fetchUsers = async () => {
        const result = await client.getTeamUsers();
        setUsers(result)
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(true)
    }, [])
    const closeBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(false)
    }, [])

    return (
        <div className='AdminPage'>
            <Sidebar
                onBoardTemplateSelectorOpen={openBoardTemplateSelector}
                onBoardTemplateSelectorClose={closeBoardTemplateSelector}
            />
            <div className='panel'>
                {boardTemplateSelectorOpen &&
                    <BoardTemplateSelector onClose={closeBoardTemplateSelector}/>
                }
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
