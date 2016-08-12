package date20141101to20160812;

import com.yineng.corpsysland.base.dao.BaseRepositoryImpl;
import com.yineng.corpsysland.base.page.CustomPageImpl;
import com.yineng.corpsysland.common.exception.YnCorpSysException;
import com.yineng.corpsysland.common.util.StringUtils;
import com.yineng.corpsysland.domain.XMGLProject;
import com.yineng.corpsysland.security.SecurityUtils;
import com.yineng.corpsysland.service.xmgl.projectmanage.XMGLInitRoleEnum;
import com.yineng.corpsysland.web.rest.xmgl.projectmanage.dto.XMGLProjectQueryDTO;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import javax.persistence.Query;
import java.util.List;

/**
 * @author yanliang
 * @ClassName XMGLProjectRepositoryImpl
 * @Description
 * @Date 2016/4/13
 */
public class XMGLProjectRepositoryImpl extends BaseRepositoryImpl{

    /**
     * 条件查询我的项目
     * @param queryDTO
     * @param pageable
     * @return
     */
    public Page<XMGLProject> findRelatedProjectByConditions(XMGLProjectQueryDTO queryDTO,Pageable pageable){

        StringBuilder hqlBuilder = new StringBuilder();
        hqlBuilder.append(" FROM XMGLProject pro " +
            "WHERE EXISTS(select middle from XMGLRoleUserMiddle middle WHERE " +
            "middle.rsglSysUser.id = :userId " +
            "AND middle.xmglRole.xmglProject.id = pro.id");
        //1：我参入的项目，2：我管理的项目，3：我部门的项目,4：我监理的
        if(queryDTO.getInvolvedProjectType() == null){
            hqlBuilder.append(")");
        }else if(queryDTO.getInvolvedProjectType() == 1){
            //这样写查出来有问题？
            //AND middle.xmglRole.initRoleType != 2 AND middle.xmglRole.initRoleType != 1
            hqlBuilder.append(" AND middle.xmglRole.initRoleType IS NULL)");
        }else if(queryDTO.getInvolvedProjectType() == 2){
            //我管理的
            hqlBuilder.append(" AND middle.xmglRole.initRoleType = "+XMGLInitRoleEnum.MANAGER.getCode()+")");
        }else if(queryDTO.getInvolvedProjectType() == 4){
            //我监理的
            hqlBuilder.append(" AND middle.xmglRole.initRoleType = "+XMGLInitRoleEnum.SUPERVISOR.getCode()+")");
        }else{
            hqlBuilder.append(")");
        }

        //计划时间
        if(queryDTO.getQueryStartDate() != null){
            hqlBuilder.append(" AND pro.planEndDate >= :startDate");
        }
        if(queryDTO.getQueryEndDate() != null){
            hqlBuilder.append(" AND pro.planEndDate <= :endDate");
        }
        //项目状态
        if(CollectionUtils.isNotEmpty(queryDTO.getProjectStatusList())){
            String statusStr = StringUtils.join(queryDTO.getProjectStatusList(),",");
            hqlBuilder.append(" AND pro.projectStatus IN ("+statusStr+")");
        }
        hqlBuilder.append("AND pro.isDel=false ORDER BY pro.planEndDate DESC");

        //总条数
        Long size = (Long)setParameters(this.em.createQuery("SELECT COUNT(pro)" + hqlBuilder.toString()),queryDTO).getSingleResult();
        List<XMGLProject> resultList = setParameters(this.em.createQuery("SELECT pro "+hqlBuilder.toString()),queryDTO)
            .setFirstResult(pageable.getPageSize()*pageable.getPageNumber())
            .setMaxResults(pageable.getPageSize()*pageable.getPageNumber() + pageable.getPageSize())
            .getResultList();

        Page<XMGLProject> pageResult = new CustomPageImpl<>(resultList,pageable,size);

        return pageResult;
    }

    /**
     * 设置参数
     * @param query
     * @param queryDTO
     * @return
     */
    private Query setParameters(Query query,XMGLProjectQueryDTO queryDTO){
        query = query.setParameter("userId", SecurityUtils.getRSGLSysUserId());
        if(queryDTO.getQueryStartDate() != null){
            query.setParameter("startDate", queryDTO.getQueryStartDate());
        }
        if(queryDTO.getQueryEndDate() != null){
            query.setParameter("endDate", queryDTO.getQueryEndDate());
        }
        return query;
    }

    /**
     * @Title: findXMGLTaskByWeekTime
     * @Description: 根据时间查询当前用户本周的项目
     * @author xiechangwei
     * @date 2016-04-28
     * @param startTime 本周开始时间
     * @param endTime 本周结束时间
     * @throw YnCorpSysException
     */
    public List<XMGLProject> findXMGLTaskByWeekTime(Long id,String startTime,String endTime) throws YnCorpSysException{
        String hql="SELECT  DISTINCT xmgl FROM XMGLProject  xmgl" +
            " LEFT JOIN xmgl.xmglRoleList  role " +
            " LEFT JOIN role.xmglRoleUserMiddles middle" +
            " WHERE 1=1 AND middle.rsglSysUser.id ="+id+" " +
            " AND xmgl.planStartDate >= '"+startTime+"'" +
            " AND xmgl.planEndDate >= '"+endTime+"'";
        Query query = em.createQuery(hql);
       List<XMGLProject> xmglProjectList = query.getResultList();
        return xmglProjectList;
    }

    /**
     * @Title: findProjectByNowTime
     * @Description: 根据当前日志时间查询我的项目
     * @author xiechangwei
     * @date 2016-04-28
     * @throw YnCorpSysException
     */

    public List<XMGLProject>  findProjectByNowTime(String nowTime) throws YnCorpSysException{
        String hql="SELECT DISTINCT xmgl FROM XMGLProject  xmgl" +
            " LEFT JOIN xmgl.xmglRoleList  role " +
            " LEFT JOIN role.xmglRoleUserMiddles middle" +
            " WHERE 1=1 AND middle.rsglSysUser.id ="+SecurityUtils.getRSGLSysUserId()+" " +
            " AND xmgl.planStartDate = '"+nowTime+"'";
        Query query = em.createQuery(hql);
        List<XMGLProject> xmglProjectList = query.getResultList();
        return xmglProjectList;
    }

}
